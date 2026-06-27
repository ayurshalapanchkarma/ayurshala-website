import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const hours = await SettingsService.getWorkingHours()
    return successResponse(hours)
  } catch (error) {
    return handleApiError(error)
  }
}
