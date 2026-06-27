import { TreatmentService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ planId: string }> }) {
  try {
    const { planId } = await params
    const plan = await TreatmentService.getTreatmentPlan(planId)
    return successResponse(plan)
  } catch (error) {
    return handleApiError(error)
  }
}
