import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/inventory/dashboard
 * Returns dashboard summary card data
 */
export async function GET() {
  const [summaryRes, topSalesRes, topOilsRes, lowStockRes] = await Promise.all([
    supabaseAdmin.from('dashboard_summary').select('*').single(),
    supabaseAdmin
      .from('report_fast_moving')
      .select('product_name, category_name, total_sold, total_consumed, total_movement')
      .limit(10),
    supabaseAdmin
      .from('oil_analytics')
      .select('product_name, unit, total_purchased, total_consumed, ledger_balance')
      .order('total_consumed', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('report_low_stock')
      .select('product_name, category_name, current_stock, reorder_level, deficit')
      .limit(10),
  ])

  if (summaryRes.error) return NextResponse.json({ error: summaryRes.error.message }, { status: 500 })

  return NextResponse.json({
    summary: summaryRes.data,
    top_selling_products: topSalesRes.data ?? [],
    top_consumed_oils: topOilsRes.data ?? [],
    low_stock_alerts: lowStockRes.data ?? [],
  })
}
