import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const templates = await SettingsService.getNotificationTemplates()
    return successResponse(templates)
  } catch (error) {
    return handleApiError(error)
  }
}
