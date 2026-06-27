import { AnalyticsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const url = new URL('http://localhost')
    const fromDate = url.searchParams.get('fromDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate = url.searchParams.get('toDate') || new Date().toISOString().split('T')[0]

    const analytics = await AnalyticsService.getFinanceAnalytics(fromDate, toDate)
    return successResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
