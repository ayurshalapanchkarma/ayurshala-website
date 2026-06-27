import { FinanceService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params
    const summary = await FinanceService.getPatientAccountSummary(patientId)
    return successResponse(summary)
  } catch (error) {
    return handleApiError(error)
  }
}
