import { ReportsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const report = await ReportsService.getCurrentStockReport()
    return successResponse(report)
  } catch (error) {
    return handleApiError(error)
  }
}
