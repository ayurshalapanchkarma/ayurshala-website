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
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (productError) throw productError

    // 2. Category count
    const { count: categoryCount, error: categoryError } = await supabaseAdmin
      .from('inv_categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (categoryError) throw categoryError

    // 3. Supplier count
    const { count: supplierCount, error: supplierError } = await supabaseAdmin
      .from('inv_suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (supplierError) throw supplierError

    // 4. Stock value = SUM(current_stock * purchase_price)
    const { data: stockData, error: stockError } = await supabaseAdmin
      .from('inv_products')
      .select('current_stock, purchase_price')
      .eq('is_active', true)

    if (stockError) throw stockError

    const stockValue = (stockData || []).reduce((sum, product) => {
      const quantity = product.current_stock || 0
      const price = product.purchase_price || 0
      return sum + (quantity * price)
    }, 0)

    // 5. Low stock count (current_stock <= reorder_level)
    const { data: lowStockData, error: lowStockError } = await supabaseAdmin
      .from('inv_products')
      .select('uuid', { count: 'exact' })
      .eq('is_active', true)
      .lte('current_stock', 'reorder_level')

    if (lowStockError) throw lowStockError

    const lowStockCount = lowStockData?.length || 0

    // 6. Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiringData, error: expiringError } = await supabaseAdmin
      .from('inv_product_batches')
      .select('uuid', { count: 'exact' })
      .eq('is_active', true)
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gt('expiry_date', new Date().toISOString())

    if (expiringError) throw expiringError

    const expiringCount = expiringData?.length || 0

    // 7. Pending POs
    const { count: pendingPoCount, error: poError } = await supabaseAdmin
      .from('inv_purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (poError) throw poError

    // 8. Today's GRNs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayGrnData, error: grnError } = await supabaseAdmin
      .from('inv_goods_receipts')
      .select('uuid', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if (grnError) throw grnError

    const todayGrnCount = todayGrnData?.length || 0

    return NextResponse.json({
      success: true,
      metrics: {
        products: productCount || 0,
        categories: categoryCount || 0,
        suppliers: supplierCount || 0,
        stockValue: Math.round(stockValue * 100) / 100, // 2 decimal places
        lowStock: lowStockCount,
        expiringsoon: expiringCount,
        pendingPos: pendingPoCount || 0,
        todaysGrn: todayGrnCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Dashboard Metrics Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
