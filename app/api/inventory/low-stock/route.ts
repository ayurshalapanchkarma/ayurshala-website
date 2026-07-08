import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/inventory/low-stock
 *
 * Comprehensive low-stock monitoring API. Returns products below their configured stock levels.
 *
 * Query Parameters:
 *   page          - Page number (default: 1)
 *   pageSize      - Items per page (default: 20)
 *   search        - Search by product name or SKU
 *   warehouse     - Filter by warehouse UUID
 *   category      - Filter by category UUID
 *   supplier      - Filter by supplier UUID
 *   status        - Filter by status: out_of_stock | critical | below_reorder | all (default: all)
 *   sortBy        - Sort field: shortfall | current_qty | reorder_level (default: shortfall)
 *   sortOrder     - asc or desc (default: desc)
 *
 * Response:
 *   {
 *     data: LowStockItem[],
 *     total: number,
 *     page: number,
 *     pageSize: number,
 *     totalPages: number,
 *     summary: {
 *       totalProducts: number,
 *       outOfStock: number,
 *       critical: number,
 *       belowReorder: number,
 *       inventoryValueAtRisk: number
 *     }
 *   }
 */

interface LowStockItem {
  productUuid: string
  productCode: string
  productName: string
  sku: string | null
  categoryName: string
  warehouseName: string | null
  currentQty: number
  minimumStock: number
  reorderLevel: number
  difference: number
  status: 'OUT_OF_STOCK' | 'CRITICAL' | 'BELOW_REORDER'
  unit: string
  lastMovement: string | null
  supplierName: string | null
  purchasePrice: number
  valueAtRisk: number
}

interface ApiResponse {
  data: LowStockItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalProducts: number
    outOfStock: number
    critical: number
    belowReorder: number
    inventoryValueAtRisk: number
  }
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10)))
    const search = searchParams.get('search') || ''
    const warehouseFilter = searchParams.get('warehouse')
    const categoryFilter = searchParams.get('category')
    const supplierFilter = searchParams.get('supplier')
    const statusFilter = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'shortfall'
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toUpperCase() as 'ASC' | 'DESC'

    // Get all products with current stock
    const { data: products, error: productError } = await supabaseAdmin
      .from('v_current_stock')
      .select(`
        product_uuid,
        product_code,
        product_name,
        barcode,
        category_name,
        unit,
        available_qty,
        reorder_level,
        minimum_stock,
        purchase_price
      `)
      .eq('is_active', true)
      .order('product_name', { ascending: true })

    if (productError) {
      console.error('Supabase v_current_stock query error:', productError)
      return NextResponse.json(
        {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          summary: {
            totalProducts: 0,
            outOfStock: 0,
            critical: 0,
            belowReorder: 0,
            inventoryValueAtRisk: 0,
          },
          error: `Database query failed: ${productError.message}`,
        },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        summary: {
          totalProducts: 0,
          outOfStock: 0,
          critical: 0,
          belowReorder: 0,
          inventoryValueAtRisk: 0,
        },
      })
    }

    // Get supplier mapping
    const { data: suppliers } = await supabaseAdmin
      .from('inv_suppliers')
      .select('uuid, company_name')
      .eq('is_active', true)

    const supplierMap = new Map((suppliers || []).map(s => [s.uuid, s.company_name]))

    // Get last movement for each product
    const { data: movements } = await supabaseAdmin
      .from('inv_stock_movements')
      .select('product_uuid, created_at')
      .order('created_at', { ascending: false })

    const lastMovementMap = new Map<string, string>()
    movements?.forEach(m => {
      if (!lastMovementMap.has(m.product_uuid)) {
        lastMovementMap.set(m.product_uuid, new Date(m.created_at).toLocaleDateString())
      }
    })

    // Filter and classify low-stock products
    const lowStockItems: LowStockItem[] = products
      .map(p => {
        const currentQty = p.available_qty || 0
        const difference = p.reorder_level - currentQty

        let status: 'OUT_OF_STOCK' | 'CRITICAL' | 'BELOW_REORDER'
        if (currentQty === 0) {
          status = 'OUT_OF_STOCK'
        } else if (currentQty <= p.minimum_stock) {
          status = 'CRITICAL'
        } else {
          status = 'BELOW_REORDER'
        }

        return {
          productUuid: p.product_uuid,
          productCode: p.product_code,
          productName: p.product_name,
          sku: p.barcode,
          categoryName: p.category_name || 'Uncategorized',
          warehouseName: null, // TODO: Add warehouse support if needed
          currentQty,
          minimumStock: p.minimum_stock || 0,
          reorderLevel: p.reorder_level || 0,
          difference: Math.max(0, difference),
          status,
          unit: p.unit || 'Unit',
          lastMovement: lastMovementMap.get(p.product_uuid) || null,
          supplierName: null, // TODO: Add supplier mapping if needed
          purchasePrice: p.purchase_price || 0,
          valueAtRisk: Math.max(0, difference) * (p.purchase_price || 0),
        }
      })
      .filter(item => {
        // Apply status filter
        if (statusFilter !== 'all') {
          const statusMap: Record<string, string[]> = {
            'out_of_stock': ['OUT_OF_STOCK'],
            'critical': ['CRITICAL'],
            'below_reorder': ['BELOW_REORDER'],
          }
          if (!statusMap[statusFilter]?.includes(item.status)) {
            return false
          }
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase()
          if (
            !item.productName.toLowerCase().includes(searchLower) &&
            !item.sku?.toLowerCase().includes(searchLower) &&
            !item.productCode.toLowerCase().includes(searchLower)
          ) {
            return false
          }
        }

        // Apply category filter
        if (categoryFilter && item.categoryName !== categoryFilter) {
          return false
        }

        // Apply warehouse filter
        if (warehouseFilter && item.warehouseName !== warehouseFilter) {
          return false
        }

        // Apply supplier filter
        if (supplierFilter && item.supplierName !== supplierFilter) {
          return false
        }

        return true
      })
      .filter(item => item.currentQty <= item.reorderLevel) // Only low stock

    // Sort
    const sorted = [...lowStockItems].sort((a, b) => {
      let aVal: number
      let bVal: number

      if (sortBy === 'shortfall') {
        aVal = a.difference
        bVal = b.difference
      } else if (sortBy === 'current_qty') {
        aVal = a.currentQty
        bVal = b.currentQty
      } else {
        aVal = a.reorderLevel
        bVal = b.reorderLevel
      }

      return sortOrder === 'DESC' ? bVal - aVal : aVal - bVal
    })

    // Calculate summary
    const summary = {
      totalProducts: lowStockItems.length,
      outOfStock: lowStockItems.filter(i => i.status === 'OUT_OF_STOCK').length,
      critical: lowStockItems.filter(i => i.status === 'CRITICAL').length,
      belowReorder: lowStockItems.filter(i => i.status === 'BELOW_REORDER').length,
      inventoryValueAtRisk: lowStockItems.reduce((sum, i) => sum + i.valueAtRisk, 0),
    }

    // Paginate
    const totalPages = Math.ceil(sorted.length / pageSize)
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      data: paginated,
      total: sorted.length,
      page,
      pageSize,
      totalPages,
      summary,
    })
  } catch (error) {
    console.error('Low stock API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      {
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        summary: {
          totalProducts: 0,
          outOfStock: 0,
          critical: 0,
          belowReorder: 0,
          inventoryValueAtRisk: 0,
        },
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
