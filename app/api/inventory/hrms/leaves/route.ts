import { HRMSService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const leave = await HRMSService.applyLeave(body as any)
    return successResponse(leave, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const leaves = await HRMSService.getPendingLeaves()
    return successResponse(leaves)
  } catch (error) {
    return handleApiError(error)
  }
}
