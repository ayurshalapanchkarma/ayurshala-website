import { AnalyticsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const kpis = await AnalyticsService.getKPIs()
    return successResponse(kpis)
  } catch (error) {
    return handleApiError(error)
  }
}
