import { FinanceService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params
    const invoice = await FinanceService.getInvoice(invoiceId)
    return successResponse(invoice)
  } catch (error) {
    return handleApiError(error)
  }
}
