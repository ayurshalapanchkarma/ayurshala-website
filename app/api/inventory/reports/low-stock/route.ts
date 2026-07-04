/**
 * Low Stock Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category_uuid = searchParams.get('category_uuid') || undefined

    const report = await ReportService.getLowStockReport({
      category_uuid,
    })

    const criticalCount = report.filter(item => item.current_stock <= (item.min_stock || 0)).length

    return NextResponse.json({
      data: report,
      summary: {
        totalLowStockItems: report.length,
        criticalItems: criticalCount,
        totalValue: report.reduce((sum, item) => sum + item.stock_value, 0),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/low-stock error:', error)
    return NextResponse.json({ error: 'Failed to generate low stock report' }, { status: 500 })
  }
}
