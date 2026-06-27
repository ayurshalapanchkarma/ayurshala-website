import { SettingsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const url = new URL('http://localhost')
    const fromDate = url.searchParams.get('fromDate')
    const toDate = url.searchParams.get('toDate')

    const holidays = await SettingsService.getHolidayCalendar(fromDate || undefined, toDate || undefined)
    return successResponse(holidays)
  } catch (error) {
    return handleApiError(error)
  }
}
