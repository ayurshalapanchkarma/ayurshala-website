import { TherapistService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ therapistId: string }> }) {
  try {
    const { therapistId } = await params
    const therapist = await TherapistService.getTherapist(therapistId)
    return successResponse(therapist)
  } catch (error) {
    return handleApiError(error)
  }
}
