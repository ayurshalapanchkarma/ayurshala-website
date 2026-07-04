import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const product_uuid = searchParams.get('product_uuid') || ''
    const supplier_uuid = searchParams.get('supplier_uuid') || ''
    
    const report = await ReportService.getBatchReport({
      product_uuid,
      supplier_uuid,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('GET /api/inventory/reports/batch-report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate batch report' },
      { status: 500 }
    )
  }
}
