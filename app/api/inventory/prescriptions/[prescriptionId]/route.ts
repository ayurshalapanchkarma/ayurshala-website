import { PrescriptionService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ prescriptionId: string }> }) {
  try {
    const { prescriptionId } = await params
    const rx = await PrescriptionService.getPrescriptionById(prescriptionId)
    return successResponse(rx)
  } catch (error) {
    return handleApiError(error)
  }
}
