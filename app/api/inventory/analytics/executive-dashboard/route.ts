import { AnalyticsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const dashboard = await AnalyticsService.getExecutiveDashboard()
    return successResponse(dashboard)
  } catch (error) {
    return handleApiError(error)
  }
}
