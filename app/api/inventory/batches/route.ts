import { BatchService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const includeExpired = searchParams.get('include_expired') === 'true'

    const batches = await BatchService.getBatches(productId || undefined, includeExpired)
    return successResponse(batches)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const batch = await BatchService.createBatch(body as any)
    return successResponse(batch, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
