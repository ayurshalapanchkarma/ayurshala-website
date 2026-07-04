/**
 * Product Ledger Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    const report = await ReportService.getProductLedger(params.productId, {
      dateFrom,
      dateTo,
    })

    return NextResponse.json({
      data: report,
      recordCount: report.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/product-ledger/[productId] error:', error)
    return NextResponse.json({ error: 'Failed to generate product ledger' }, { status: 500 })
  }
}
