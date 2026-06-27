import { APIGatewayService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function POST(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    await APIGatewayService.revokeSession(sessionId)
    return successResponse({ status: 'revoked' })
  } catch (error) {
    return handleApiError(error)
  }
}
