import { NextRequest, NextResponse } from 'next/server'
import { PurchaseOrderService } from '@/lib/inventory/purchase-order-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const purchaseOrder = await PurchaseOrderService.approvePurchaseOrder(id, userId)
    return NextResponse.json(purchaseOrder)
  } catch (error: any) {
    console.error('POST /api/inventory/purchase-orders/[id]/approve error:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to approve purchase order' },
      { status: 500 }
    )
  }
}
