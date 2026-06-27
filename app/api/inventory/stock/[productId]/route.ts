import { InventoryEngineService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const stock = await InventoryEngineService.getCurrentStock(productId)
    return successResponse(stock)
  } catch (error) {
    return handleApiError(error)
  }
}
