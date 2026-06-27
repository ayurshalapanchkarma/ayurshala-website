import { FinanceService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const outstanding = await FinanceService.getOutstandingInvoices()
    return successResponse(outstanding)
  } catch (error) {
    return handleApiError(error)
  }
}
