import { CampaignService } from '@/lib/inventory'
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

    const campaign = await CampaignService.createCampaign(body as any, session?.user?.id || '')
    return successResponse(campaign, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const campaigns = await CampaignService.getActiveCampaigns()
    return successResponse(campaigns)
  } catch (error) {
    return handleApiError(error)
  }
}
