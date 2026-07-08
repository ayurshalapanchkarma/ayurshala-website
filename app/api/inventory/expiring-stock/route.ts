import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/inventory/expiring-stock
 *
 * Comprehensive expiring-stock monitoring API. Returns batches nearing or past expiry.
 *
 * Query Parameters:
 *   page          - Page number (default: 1)
 *   pageSize      - Items per page (default: 25)
 *   search        - Search by product name or batch number
 *   warehouse     - Filter by warehouse UUID
 *   category      - Filter by category UUID
 *   supplier      - Filter by supplier UUID
 *   status        - Filter: expired | expiring_7 | expiring_30 | expiring_90 | all (default: all)
 *   expiryStart   - Filter batches expiring after this date (YYYY-MM-DD)
 *   expiryEnd     - Filter batches expiring before this date (YYYY-MM-DD)
 *   sortBy        - Sort field: days_to_expiry | expiry_date | product_name (default: days_to_expiry)
 *   sortOrder     - asc or desc (default: asc)
 *
 * Response:
 *   {
 *     data: ExpiringBatchItem[],
 *     total: number,
 *     page: number,
 *     pageSize: number,
 *     totalPages: number,
 *     summary: {
 *       expired: number,
 *       expires7Days: number,
 *       expires30Days: number,
 *       expires90Days: number,
 *       inventoryValue: number
 *     }
 *   }
 */

interface ExpiringBatchItem {
  batchUuid: string
  productUuid: string
  productCode: string
  productName: string
  sku: string | null
  categoryName: string
  batchNumber: string
  warehouseName: string | null
  supplierName: string | null
  manufacturingDate: string | null
  expiryDate: string
  daysRemaining: number
  currentQuantity: number
  unitCost: number
  totalValue: number
  unit: string
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK'
}

interface ApiResponse {
  data: ExpiringBatchItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    expired: number
    expires7Days: number
    expires30Days: number
    expires90Days: number
    inventoryValue: number
  }
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10)))
    const search = searchParams.get('search') || ''
    const warehouseFilter = searchParams.get('warehouse')
    const categoryFilter = searchParams.get('category')
    const supplierFilter = searchParams.get('supplier')
    const statusFilter = searchParams.get('status') || 'all'
    const expiryStart = searchParams.get('expiryStart')
    const expiryEnd = searchParams.get('expiryEnd')
    const sortBy = searchParams.get('sortBy') || 'days_to_expiry'
    const sortOrder = (searchParams.get('sortOrder') || 'asc').toUpperCase() as 'ASC' | 'DESC'

    // Get all product batches with expiry info
    let query = supabaseAdmin
      .from('inv_product_batches')
      .select(`
        uuid,
        batch_number,
        expiry_date,
        manufacturing_date,
        available_quantity,
        product_uuid,
        supplier_uuid,
        created_at,
        inv_products!product_uuid (
          uuid,
          product_code,
          product_name,
          barcode,
          purchase_price,
          inv_categories!category_uuid (
            name
          ),
          inv_units!unit_uuid (
            short_name
          )
        ),
        inv_suppliers!supplier_uuid (
          company_name
        )
      `)
      .eq('is_active', true)
      .not('expiry_date', 'is', null)

    const { data: batches, error: batchError } = await query

    if (batchError) {
      console.error('Supabase batch query error:', batchError)
      return NextResponse.json(
        {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          summary: {
            expired: 0,
            expires7Days: 0,
            expires30Days: 0,
            expires90Days: 0,
            inventoryValue: 0,
          },
          error: `Database query failed: ${batchError.message}`,
        },
        { status: 500 }
      )
    }

    if (!batches || batches.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        summary: {
          expired: 0,
          expires7Days: 0,
          expires30Days: 0,
          expires90Days: 0,
          inventoryValue: 0,
        },
      })
    }

    // Process batches
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiringItems: ExpiringBatchItem[] = batches
      .map((b: any) => {
        const expiryDate = new Date(b.expiry_date)
        expiryDate.setHours(0, 0, 0, 0)
        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        let status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK'
        if (daysRemaining < 0) {
          status = 'EXPIRED'
        } else if (daysRemaining <= 7) {
          status = 'CRITICAL'
        } else if (daysRemaining <= 30) {
          status = 'WARNING'
        } else {
          status = 'OK'
        }

        const product = b.inv_products as any
        const unitCost = product?.purchase_price || 0
        const totalValue = (b.available_quantity || 0) * unitCost

        return {
          batchUuid: b.uuid,
          productUuid: product?.uuid,
          productCode: product?.product_code,
          productName: product?.product_name,
          sku: product?.barcode,
          categoryName: product?.inv_categories?.name || 'Uncategorized',
          batchNumber: b.batch_number,
          warehouseName: null, // TODO: Add warehouse support if needed
          supplierName: b.inv_suppliers?.company_name || null,
          manufacturingDate: b.manufacturing_date ? new Date(b.manufacturing_date).toLocaleDateString() : null,
          expiryDate: new Date(b.expiry_date).toLocaleDateString(),
          daysRemaining,
          currentQuantity: b.available_quantity || 0,
          unitCost,
          totalValue,
          unit: product?.inv_units?.short_name || 'Unit',
          status,
        }
      })
      .filter(item => {
        // Apply status filter
        if (statusFilter !== 'all') {
          const statusMap: Record<string, string[]> = {
            'expired': ['EXPIRED'],
            'expiring_7': ['CRITICAL'],
            'expiring_30': ['WARNING'],
            'expiring_90': ['OK'],
          }
          if (!statusMap[statusFilter]?.includes(item.status)) {
            return false
          }
        }

        // Apply date range filters
        if (expiryStart) {
          const startDate = new Date(expiryStart)
          const itemExpiryDate = new Date(item.expiryDate)
          if (itemExpiryDate < startDate) {
            return false
          }
        }

        if (expiryEnd) {
          const endDate = new Date(expiryEnd)
          const itemExpiryDate = new Date(item.expiryDate)
          if (itemExpiryDate > endDate) {
            return false
          }
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase()
          if (
            !item.productName.toLowerCase().includes(searchLower) &&
            !item.sku?.toLowerCase().includes(searchLower) &&
            !item.batchNumber.toLowerCase().includes(searchLower)
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

    // Sort
    const sorted = [...expiringItems].sort((a, b) => {
      let aVal: any
      let bVal: any

      if (sortBy === 'days_to_expiry') {
        aVal = a.daysRemaining
        bVal = b.daysRemaining
      } else if (sortBy === 'expiry_date') {
        aVal = new Date(a.expiryDate).getTime()
        bVal = new Date(b.expiryDate).getTime()
      } else {
        aVal = a.productName
        bVal = b.productName
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'DESC' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      }

      return sortOrder === 'DESC' ? bVal - aVal : aVal - bVal
    })

    // Calculate summary
    const summary = {
      expired: expiringItems.filter(i => i.status === 'EXPIRED').length,
      expires7Days: expiringItems.filter(i => i.status === 'CRITICAL').length,
      expires30Days: expiringItems.filter(i => i.status === 'WARNING').length,
      expires90Days: expiringItems.filter(i => i.status === 'OK' && i.daysRemaining <= 90).length,
      inventoryValue: expiringItems.reduce((sum, i) => sum + i.totalValue, 0),
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
    console.error('Expiring stock API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      {
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
        summary: {
          expired: 0,
          expires7Days: 0,
          expires30Days: 0,
          expires90Days: 0,
          inventoryValue: 0,
        },
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
