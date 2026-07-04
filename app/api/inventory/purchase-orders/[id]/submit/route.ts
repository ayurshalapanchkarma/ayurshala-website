import { NextRequest, NextResponse } from 'next/server'
import { PurchaseOrderService } from '@/lib/inventory/purchase-order-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const purchaseOrder = await PurchaseOrderService.submitForApproval(params.id, userId)
    return NextResponse.json(purchaseOrder)
  } catch (error: any) {
    console.error('POST /api/inventory/purchase-orders/[id]/submit error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to submit purchase order' }, { status: 500 })
  }
}
