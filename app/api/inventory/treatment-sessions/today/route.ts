import { TreatmentService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const sessions = await TreatmentService.getTodaySessions()
    return successResponse(sessions)
  } catch (error) {
    return handleApiError(error)
  }
}
