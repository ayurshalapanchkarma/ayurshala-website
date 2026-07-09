import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * GET /api/inventory/dashboard/metrics
 * 
 * Fetches real-time dashboard metrics:
 * - Product count
 * - Category count
 * - Supplier count
 * - Stock value
 * - Low stock count
 * - Expiring soon count
 * - Pending PO count
 * - Today's GRN count
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Product count (active only)
    const { count: productCount, error: productError } = await supabaseAdmin
      .from('inv_products')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)

    if (productError) throw productError

    // 2. Category count
    const { count: categoryCount, error: categoryError } = await supabaseAdmin
      .from('inv_categories')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)

    if (categoryError) throw categoryError

    // 3. Supplier count
    const { count: supplierCount, error: supplierError } = await supabaseAdmin
      .from('inv_suppliers')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)

    if (supplierError) throw supplierError

    // 4. Stock value = SUM(available_quantity * purchase_price) from all active batches
    const { data: stockData, error: stockError } = await supabaseAdmin
      .from('inv_product_batches')
      .select('available_quantity, purchase_price')
      .eq('is_active', true)

    if (stockError) throw stockError

    const stockValue = (stockData || []).reduce((sum, batch) => {
      const quantity = parseFloat(String(batch.available_quantity || 0))
      const price = parseFloat(String(batch.purchase_price || 0))
      return sum + (quantity * price)
    }, 0)

    // 5. Low stock count (total available_quantity <= reorder_level)
    // Get all active batches grouped by product
    const { data: allBatches, error: allBatchesError } = await supabaseAdmin
      .from('inv_product_batches')
      .select('product_uuid, available_quantity')
      .eq('is_active', true)

    if (allBatchesError) throw allBatchesError

    // Group by product and sum quantities
    const stockByProduct: Record<string, number> = {}
    ;(allBatches || []).forEach(batch => {
      const productId = batch.product_uuid as string
      const qty = parseFloat(String(batch.available_quantity || 0))
      stockByProduct[productId] = (stockByProduct[productId] || 0) + qty
    })

    // Get reorder levels for products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('inv_products')
      .select('uuid, reorder_level')
      .eq('is_active', true)

    if (productsError) throw productsError

    const lowStockCount = (products || []).filter(product => {
      const currentStock = stockByProduct[product.uuid as string] || 0
      const reorderLevel = parseFloat(String(product.reorder_level || 0))
      return currentStock <= reorderLevel
    }).length

    // 6. Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { count: expiringCount, error: expiringError } = await supabaseAdmin
      .from('inv_product_batches')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gt('expiry_date', new Date().toISOString().split('T')[0])

    if (expiringError) throw expiringError

    // 7. Pending POs
    const { count: pendingPoCount, error: poError } = await supabaseAdmin
      .from('inv_purchase_orders')
      .select('uuid', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (poError) throw poError

    // 8. Today's GRNs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { count: todayGrnCount, error: grnError } = await supabaseAdmin
      .from('inv_goods_receipts')
      .select('uuid', { count: 'exact', head: true })
      .gte('created_at', todayStr)
      .lt('created_at', tomorrowStr)

    if (grnError) throw grnError

    return NextResponse.json({
      success: true,
      metrics: {
        products: productCount || 0,
        categories: categoryCount || 0,
        suppliers: supplierCount || 0,
        stockValue: Math.round(stockValue * 100) / 100,
        lowStock: lowStockCount,
        expiringsoon: expiringCount || 0,
        pendingPos: pendingPoCount || 0,
        todaysGrn: todayGrnCount || 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Metrics API] Error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
