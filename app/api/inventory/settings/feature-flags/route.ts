import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const flags = await SettingsService.getFeatureFlags()
    return successResponse(flags)
  } catch (error) {
    return handleApiError(error)
  }
}
