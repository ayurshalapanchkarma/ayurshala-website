import { HRMSService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const payrolls = await HRMSService.generatePayroll(
      (body as any).payrollMonth,
      (body as any).employeeIds || [],
    )
    return successResponse(payrolls, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
