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
    console.log('[Metrics API] Starting...')
    console.log('[Metrics API] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'NOT SET')
    console.log('[Metrics API] Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET')

    // 1. Product count (active only)
    console.log('[Metrics API] Fetching product count...')
    const { count: productCount, error: productError } = await supabaseAdmin
      .from('inv_products')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)

    if (productError) {
      console.error('[Metrics API] Product error:', productError)
      throw productError
    }
    console.log('[Metrics API] Product count:', productCount)

    // 2. Category count
    console.log('[Metrics API] Fetching category count...')
    const { count: categoryCount, error: categoryError } = await supabaseAdmin
      .from('inv_categories')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)

    if (categoryError) {
      console.error('[Metrics API] Category error:', categoryError)
      throw categoryError
    }
    console.log('[Metrics API] Category count:', categoryCount)

    // 3. Supplier count
    console.log('[Metrics API] Fetching supplier count...')
    const { count: supplierCount, error: supplierError } = await supabaseAdmin
      .from('inv_suppliers')
      .select('uuid', { count: 'exact', head: true })
      .eq('is_active', true)

    if (supplierError) {
      console.error('[Metrics API] Supplier error:', supplierError)
      throw supplierError
    }
    console.log('[Metrics API] Supplier count:', supplierCount)

    // 4. Stock value = SUM(current_stock * purchase_price)
    console.log('[Metrics API] Fetching stock data...')
    const { data: stockData, error: stockError } = await supabaseAdmin
      .from('inv_products')
      .select('current_stock, purchase_price')
      .eq('is_active', true)

    if (stockError) {
      console.error('[Metrics API] Stock error:', stockError)
      throw stockError
    }
    console.log('[Metrics API] Stock records:', stockData?.length)

    const stockValue = (stockData || []).reduce((sum, product) => {
      const quantity = product.current_stock || 0
      const price = product.purchase_price || 0
      return sum + (quantity * price)
    }, 0)
    console.log('[Metrics API] Stock value:', stockValue)

    // 5. Low stock count (current_stock <= reorder_level)
    console.log('[Metrics API] Fetching low stock count...')
    const { data: lowStockData, error: lowStockError } = await supabaseAdmin
      .from('inv_products')
      .select('uuid')
      .eq('is_active', true)
      .lte('current_stock', 'reorder_level')

    if (lowStockError) {
      console.error('[Metrics API] Low stock error:', lowStockError)
      throw lowStockError
    }
    const lowStockCount = lowStockData?.length || 0
    console.log('[Metrics API] Low stock count:', lowStockCount)

    // 6. Expiring soon (within 30 days)
    console.log('[Metrics API] Fetching expiring soon count...')
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiringData, error: expiringError } = await supabaseAdmin
      .from('inv_product_batches')
      .select('uuid')
      .eq('is_active', true)
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gt('expiry_date', new Date().toISOString())

    if (expiringError) {
      console.error('[Metrics API] Expiring error:', expiringError)
      throw expiringError
    }
    const expiringCount = expiringData?.length || 0
    console.log('[Metrics API] Expiring count:', expiringCount)

    // 7. Pending POs
    console.log('[Metrics API] Fetching pending PO count...')
    const { count: pendingPoCount, error: poError } = await supabaseAdmin
      .from('inv_purchase_orders')
      .select('uuid', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (poError) {
      console.error('[Metrics API] PO error:', poError)
      throw poError
    }
    console.log('[Metrics API] Pending PO count:', pendingPoCount)

    // 8. Today's GRNs
    console.log('[Metrics API] Fetching today GRN count...')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayGrnData, error: grnError } = await supabaseAdmin
      .from('inv_goods_receipts')
      .select('uuid')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if (grnError) {
      console.error('[Metrics API] GRN error:', grnError)
      throw grnError
    }
    const todayGrnCount = todayGrnData?.length || 0
    console.log('[Metrics API] Today GRN count:', todayGrnCount)

    const response = {
      success: true,
      metrics: {
        products: productCount || 0,
        categories: categoryCount || 0,
        suppliers: supplierCount || 0,
        stockValue: Math.round(stockValue * 100) / 100,
        lowStock: lowStockCount,
        expiringsoon: expiringCount,
        pendingPos: pendingPoCount || 0,
        todaysGrn: todayGrnCount,
      },
      timestamp: new Date().toISOString(),
    }
    console.log('[Metrics API] Success, returning:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Metrics API] Fatal error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[Metrics API] Error message:', errorMsg)
    console.error('[Metrics API] Full error:', JSON.stringify(error))
    
    return NextResponse.json(
      { 
        error: errorMsg,
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    )
  }
}
