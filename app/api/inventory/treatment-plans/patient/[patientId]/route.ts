import { TreatmentService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params
    const treatments = await TreatmentService.getPatientTreatments(patientId)
    return successResponse(treatments)
  } catch (error) {
    return handleApiError(error)
  }
}
