import { TreatmentService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const body = await parseBody(request)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session: authSession } } = await supabase.auth.getSession()

    const input = { sessionId, ...(body || {}) }
    const completed = await TreatmentService.completeSession(
      input as any,
      authSession?.user?.id || '',
    )
    return successResponse(completed)
  } catch (error) {
    return handleApiError(error)
  }
}
