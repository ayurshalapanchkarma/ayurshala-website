import { AIService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    if (!query) throw new Error('Search query required')

    const results = await AIService.searchKnowledgeBase(query)
    return successResponse(results)
  } catch (error) {
    return handleApiError(error)
  }
}
