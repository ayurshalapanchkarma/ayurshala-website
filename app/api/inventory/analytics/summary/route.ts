import { AnalyticsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const analytics = {
      treatments: await AnalyticsService.getTreatmentAnalytics(),
      inventory: await AnalyticsService.getInventoryAnalytics(),
      patients: await AnalyticsService.getPatientAnalytics(),
      packages: await AnalyticsService.getPackageAnalytics(),
      crm: await AnalyticsService.getCRMAnalytics(),
    }
    return successResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
