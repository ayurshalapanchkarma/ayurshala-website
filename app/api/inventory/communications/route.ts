import { CRMService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const log = await CRMService.logCommunication(body as any)
    return successResponse(log, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
