import { RoomService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const room = await RoomService.createRoom(body as any)
    return successResponse(room, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const rooms = await RoomService.getActiveRooms()
    return successResponse(rooms)
  } catch (error) {
    return handleApiError(error)
  }
}
