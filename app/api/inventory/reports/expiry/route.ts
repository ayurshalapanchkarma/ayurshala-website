/**
 * Expiry Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const report = await ReportService.getExpiryReport()

    const expiredCount = report.filter(b => b.days_to_expiry !== undefined && b.days_to_expiry < 0).length
    const expiringIn30 = report.filter(b => b.days_to_expiry !== undefined && b.days_to_expiry <= 30).length

    return NextResponse.json({
      data: report,
      summary: {
        totalExpiring: report.length,
        expiredCount,
        expiringIn30,
        expiringIn90: report.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/expiry error:', error)
    return NextResponse.json({ error: 'Failed to generate expiry report' }, { status: 500 })
  }
}
