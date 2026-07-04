import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category_uuid = searchParams.get('category_uuid') || ''
    
    const report = await ReportService.getExpiryReport({
      category_uuid,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('GET /api/inventory/reports/expiry-report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate expiry report' },
      { status: 500 }
    )
  }
}
