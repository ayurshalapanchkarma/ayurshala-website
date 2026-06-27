import { AnalyticsService } from '@/lib/inventory'
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

    const report = await AnalyticsService.saveReport(
      (body as any).reportName,
      (body as any).reportType,
      (body as any).module,
      (body as any).filters,
      session?.user?.id || '',
    )
    return successResponse(report, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(_: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    const reports = await AnalyticsService.getSavedReports(session?.user?.id || '')
    return successResponse(reports)
  } catch (error) {
    return handleApiError(error)
  }
}
