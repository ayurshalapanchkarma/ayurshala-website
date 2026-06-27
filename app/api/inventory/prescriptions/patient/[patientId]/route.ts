import { PrescriptionService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params
    const prescriptions = await PrescriptionService.getPatientPrescriptions(patientId)
    return successResponse(prescriptions)
  } catch (error) {
    return handleApiError(error)
  }
}
