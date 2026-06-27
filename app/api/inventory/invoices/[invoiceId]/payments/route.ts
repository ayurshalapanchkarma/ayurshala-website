import { FinanceService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params
    const body = await parseBody(request)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    const payment = await FinanceService.recordPayment(
      invoiceId,
      (body as any).amount,
      (body as any).paymentMethod,
      session?.user?.id || '',
      (body as any).transactionId,
    )
    return successResponse(payment, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
