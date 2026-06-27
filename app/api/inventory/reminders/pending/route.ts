import { CRMService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const reminders = await CRMService.getPendingReminders()
    return successResponse(reminders)
  } catch (error) {
    return handleApiError(error)
  }
}
