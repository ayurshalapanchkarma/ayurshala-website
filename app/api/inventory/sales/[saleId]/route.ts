import { SalesService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ saleId: string }> }) {
  try {
    const { saleId } = await params
    const sale = await SalesService.getSaleById(saleId)
    return successResponse(sale)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(_: Request, { params }: { params: Promise<{ saleId: string }> }) {
  try {
    const { saleId } = await params
    const sale = await SalesService.completeSale(saleId)
    return successResponse(sale)
  } catch (error) {
    return handleApiError(error)
  }
}
