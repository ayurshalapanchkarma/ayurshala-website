/**
 * Dead Stock Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const report = await ReportService.getDeadStockReport()

    const totalValue = report.reduce((sum, item) => sum + item.stock_value, 0)

    return NextResponse.json({
      data: report,
      summary: {
        totalDeadStockItems: report.length,
        totalValue,
        avgValuePerItem: report.length > 0 ? totalValue / report.length : 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/dead-stock error:', error)
    return NextResponse.json({ error: 'Failed to generate dead stock report' }, { status: 500 })
  }
}
