import { AIService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params
    const body = await parseBody(request)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) throw new Error('Unauthorized')

    const response = await AIService.chat(
      conversationId,
      (body as any).message,
      {
        userId: session.user.id,
        userRole: (body as any).userRole || 'PATIENT',
        assistantType: (body as any).assistantType || 'GENERAL',
      },
    )

    return successResponse(response, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params
    const history = await AIService.getConversationHistory(conversationId)
    return successResponse(history)
  } catch (error) {
    return handleApiError(error)
  }
}
