import { AIService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) throw new Error('Unauthorized')

    const workflow = await AIService.createWorkflow(
      (body as any).workflowName,
      (body as any).triggerEvent,
      (body as any).actions || [],
      session.user.id,
    )

    return successResponse(workflow, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
