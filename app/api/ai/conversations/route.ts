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

    const conversation = await AIService.startConversation({
      userId: session.user.id,
      userRole: (body as any).userRole || 'PATIENT',
      assistantType: (body as any).assistantType || 'GENERAL',
    })

    return successResponse(conversation, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
