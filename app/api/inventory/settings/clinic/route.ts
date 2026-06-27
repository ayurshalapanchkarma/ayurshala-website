import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const settings = await SettingsService.getClinicSettings()
    return successResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await parseBody(request)
    const settings = await SettingsService.updateClinicSettings(body as any)
    return successResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}
