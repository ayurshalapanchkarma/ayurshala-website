import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const methods = await SettingsService.getPaymentMethods()
    return successResponse(methods)
  } catch (error) {
    return handleApiError(error)
  }
}
