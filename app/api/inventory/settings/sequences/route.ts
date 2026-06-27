import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const sequences = await SettingsService.getAllSequences()
    return successResponse(sequences)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const sequence = await SettingsService.createNumberSequence(body as any)
    return successResponse(sequence, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
