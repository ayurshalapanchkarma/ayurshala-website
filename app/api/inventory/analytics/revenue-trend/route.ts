import { AnalyticsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const trend = await AnalyticsService.getRevenueTrend()
    return successResponse(trend)
  } catch (error) {
    return handleApiError(error)
  }
}
