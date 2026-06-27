import { CRMService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request, { params }: { params: Promise<{ followupId: string }> }) {
  try {
    const { followupId } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    const followup = await CRMService.completeFollowup(followupId, session?.user?.id || '')
    return successResponse(followup)
  } catch (error) {
    return handleApiError(error)
  }
}
