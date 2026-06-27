import { RoomService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const room = await RoomService.getRoom(roomId)
    return successResponse(room)
  } catch (error) {
    return handleApiError(error)
  }
}
