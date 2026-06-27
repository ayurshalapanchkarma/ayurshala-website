import { FinanceService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const revenue = await FinanceService.getTodayRevenue()
    return successResponse(revenue)
  } catch (error) {
    return handleApiError(error)
  }
}
