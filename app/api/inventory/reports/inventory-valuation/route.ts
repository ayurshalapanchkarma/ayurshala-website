/**
 * Inventory Valuation Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category_uuid = searchParams.get('category_uuid') || undefined

    const report = await ReportService.getInventoryValuation({
      category_uuid,
    })

    const totalValue = report.reduce((sum, item) => sum + item.total_value, 0)

    return NextResponse.json({
      data: report,
      summary: {
        totalValue,
        recordCount: report.length,
        avgValuePerProduct: report.length > 0 ? totalValue / report.length : 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/inventory-valuation error:', error)
    return NextResponse.json({ error: 'Failed to generate inventory valuation report' }, { status: 500 })
  }
}
