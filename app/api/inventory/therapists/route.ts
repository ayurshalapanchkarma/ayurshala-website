import { TherapistService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const therapist = await TherapistService.createTherapist(body as any)
    return successResponse(therapist, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const therapists = await TherapistService.getActiveTherapists()
    return successResponse(therapists)
  } catch (error) {
    return handleApiError(error)
  }
}
