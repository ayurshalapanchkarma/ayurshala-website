import { CRMService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params
    const timeline = await CRMService.getPatientTimeline(patientId)
    return successResponse(timeline)
  } catch (error) {
    return handleApiError(error)
  }
}
