import { CRMService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const reminder = await CRMService.createReminder(body as any)
    return successResponse(reminder, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
