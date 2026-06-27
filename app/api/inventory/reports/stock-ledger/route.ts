import { ReportsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const report = await ReportsService.getStockLedgerReport(productId || undefined, startDate || undefined, endDate || undefined)
    return successResponse(report)
  } catch (error) {
    return handleApiError(error)
  }
}
