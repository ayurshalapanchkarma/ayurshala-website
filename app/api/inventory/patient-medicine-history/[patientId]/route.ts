import { SalesService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const { patientId } = await params
    const history = await SalesService.getPatientMedicineHistory(patientId)
    return successResponse(history)
  } catch (error) {
    return handleApiError(error)
  }
}
