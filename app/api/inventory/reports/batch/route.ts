/**
 * Batch Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const product_uuid = searchParams.get('product_uuid') || undefined
    const supplier_uuid = searchParams.get('supplier_uuid') || undefined

    const report = await ReportService.getBatchReport({
      product_uuid,
      supplier_uuid,
    })

    const expiringCount = report.filter(batch => 
      batch.expiry_date && batch.days_to_expiry !== undefined && batch.days_to_expiry <= 90
    ).length

    return NextResponse.json({
      data: report,
      summary: {
        totalBatches: report.length,
        expiringCount,
        expiredCount: report.filter(b => b.expiry_date && b.days_to_expiry !== undefined && b.days_to_expiry < 0).length,
        totalReceived: report.reduce((sum, item) => sum + item.received_quantity, 0),
        totalAvailable: report.reduce((sum, item) => sum + item.available_quantity, 0),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/batch error:', error)
    return NextResponse.json({ error: 'Failed to generate batch report' }, { status: 500 })
  }
}
