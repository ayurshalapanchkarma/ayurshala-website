import { TreatmentService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const session = await TreatmentService.scheduleSession(body as any)
    return successResponse(session, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
