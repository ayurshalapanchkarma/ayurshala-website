/**
 * Purchase Register Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const supplier_uuid = searchParams.get('supplier_uuid') || undefined

    const report = await ReportService.getPurchaseRegister({
      dateFrom,
      dateTo,
      supplier_uuid,
    })

    const totalAmount = report.reduce((sum, item) => sum + item.net_amount, 0)

    return NextResponse.json({
      data: report,
      summary: {
        totalAmount,
        totalGST: report.reduce((sum, item) => sum + item.gst_amount, 0),
        recordCount: report.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/purchase-register error:', error)
    return NextResponse.json({ error: 'Failed to generate purchase register' }, { status: 500 })
  }
}
