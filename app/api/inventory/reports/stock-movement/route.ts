/**
 * Stock Movement Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const product_uuid = searchParams.get('product_uuid') || undefined
    const movement_type = searchParams.get('movement_type') || undefined

    const report = await ReportService.getStockMovementReport({
      dateFrom,
      dateTo,
      product_uuid,
      movement_type,
    })

    return NextResponse.json({
      data: report,
      recordCount: report.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/stock-movement error:', error)
    return NextResponse.json({ error: 'Failed to generate stock movement report' }, { status: 500 })
  }
}
