import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inventory/search?q=query
 * 
 * Global inventory search across all major entities
 * Returns grouped results from production Supabase database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        products: [],
        suppliers: [],
        purchaseOrders: [],
        batches: [],
        warehouses: [],
        categories: [],
      })
    }

    const searchTerm = `%${query}%`

    // Execute parallel searches
    const [productsResult, suppliersResult, poResult, batchesResult, warehousesResult, categoriesResult] =
      await Promise.all([
        // Search products
        supabaseAdmin
          .from('inv_products')
          .select('uuid, product_code, product_name, sku')
          .eq('is_active', true)
          .or(`product_name.ilike.${searchTerm},product_code.ilike.${searchTerm},sku.ilike.${searchTerm}`)
          .limit(10),

        // Search suppliers
        supabaseAdmin
          .from('inv_suppliers')
          .select('uuid, company_name, contact_person')
          .eq('is_active', true)
          .ilike('company_name', searchTerm)
          .limit(10),

        // Search purchase orders
        supabaseAdmin
          .from('inv_purchase_orders')
          .select('uuid, po_number, supplier_uuid, created_at')
          .eq('is_active', true)
          .ilike('po_number', searchTerm)
          .limit(10),

        // Search batches
        supabaseAdmin
          .from('inv_product_batches')
          .select('uuid, batch_number, product_uuid, expiry_date')
          .eq('is_active', true)
          .ilike('batch_number', searchTerm)
          .limit(10),

        // Search warehouses
        supabaseAdmin
          .from('inv_warehouses')
          .select('uuid, warehouse_name, location')
          .eq('is_active', true)
          .ilike('warehouse_name', searchTerm)
          .limit(10),

        // Search categories
        supabaseAdmin
          .from('inv_categories')
          .select('uuid, name')
          .eq('is_active', true)
          .ilike('name', searchTerm)
          .limit(10),
      ])

    return NextResponse.json({
      products: productsResult.data || [],
      suppliers: suppliersResult.data || [],
      purchaseOrders: poResult.data || [],
      batches: batchesResult.data || [],
      warehouses: warehousesResult.data || [],
      categories: categoriesResult.data || [],
    })
  } catch (error) {
    console.error('[Inventory Search API] Error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
