import { InventoryEngineService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!productId) {
      return handleApiError(new Error('product_id is required'))
    }

    const ledger = await InventoryEngineService.getStockLedger(productId, limit)
    return successResponse(ledger)
  } catch (error) {
    return handleApiError(error)
  }
}
