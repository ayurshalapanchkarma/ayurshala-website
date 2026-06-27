import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/inventory/reports?type=REPORT_TYPE
 *
 * Available types:
 *   stock          — full stock summary
 *   low_stock      — below reorder level
 *   expiry         — expiry dashboard
 *   purchases      — monthly purchase summary
 *   sales          — monthly sales summary
 *   valuation      — inventory value
 *   fast_moving    — top moved products (30 days)
 *   slow_moving    — no movement in 30 days
 *   treatment      — treatment consumption
 *   oil            — oil analytics
 *   oil_monthly    — oil monthly report
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'stock'

  const viewMap: Record<string, string> = {
    stock:         'report_stock_summary',
    low_stock:     'report_low_stock',
    expiry:        'expiry_dashboard',
    purchases:     'report_purchase_summary',
    sales:         'report_sales_summary',
    valuation:     'report_inventory_valuation',
    fast_moving:   'report_fast_moving',
    slow_moving:   'report_slow_moving',
    treatment:     'report_treatment_consumption',
    oil:           'oil_analytics',
    oil_monthly:   'oil_consumption_report',
  }

  const view = viewMap[type]
  if (!view) {
    return NextResponse.json(
      { error: `Unknown report type: ${type}. Available: ${Object.keys(viewMap).join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin.from(view).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ report: type, data })
}
