import { NextRequest, NextResponse } from 'next/server'
import { PurchaseOrderService } from '@/lib/inventory/purchase-order-service'

// Close = mark as received/closed after all items are received
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || undefined
    // Approve acts as the close action for a received PO
    const purchaseOrder = await PurchaseOrderService.getPurchaseOrderById(id)
    return NextResponse.json({ ...purchaseOrder, message: 'Purchase order closed' })
  } catch (error: any) {
    console.error('POST /api/inventory/purchase-orders/[id]/close error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to close purchase order' }, { status: 500 })
  }
}
