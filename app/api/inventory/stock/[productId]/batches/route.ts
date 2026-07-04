import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const batches = await StockService.getProductBatches(params.productId)
    return NextResponse.json({ batches })
  } catch (error) {
    console.error('GET /api/inventory/stock/[productId]/batches error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product batches' },
      { status: 500 }
    )
  }
}
