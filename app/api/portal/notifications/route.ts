import { APIGatewayService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) throw new Error('Unauthorized')

    const notifications = await APIGatewayService.getUserNotifications(session.user.id)
    return successResponse(notifications)
  } catch (error) {
    return handleApiError(error)
  }
}
