import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const roles = await SettingsService.getRoles()
    return successResponse(roles)
  } catch (error) {
    return handleApiError(error)
  }
}
