import { HRMSService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const employee = await HRMSService.createEmployee(body as any, 'system')
    return successResponse(employee, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const employees = await HRMSService.getActiveEmployees()
    return successResponse(employees)
  } catch (error) {
    return handleApiError(error)
  }
}
