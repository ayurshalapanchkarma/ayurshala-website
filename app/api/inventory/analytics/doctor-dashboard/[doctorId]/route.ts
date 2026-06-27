import { AnalyticsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ doctorId: string }> }) {
  try {
    const { doctorId } = await params
    const dashboard = await AnalyticsService.getDoctorDashboard(doctorId)
    return successResponse(dashboard)
  } catch (error) {
    return handleApiError(error)
  }
}
