import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const taxes = await SettingsService.getTaxSettings()
    return successResponse(taxes)
  } catch (error) {
    return handleApiError(error)
  }
}
