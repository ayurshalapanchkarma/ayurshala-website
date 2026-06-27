import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const branding = await SettingsService.getBranding()
    return successResponse(branding)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await (request.json())
    const branding = await SettingsService.updateBranding(body)
    return successResponse(branding)
  } catch (error) {
    return handleApiError(error)
  }
}
