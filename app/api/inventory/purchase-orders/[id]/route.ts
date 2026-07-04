import { NextRequest, NextResponse } from 'next/server'
import { PurchaseOrderService } from '@/lib/inventory/purchase-order-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseOrder = await PurchaseOrderService.getPurchaseOrderById(params.id)
    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error('GET /api/inventory/purchase-orders/[id] error:', error)
    return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id') || undefined
    const purchaseOrder = await PurchaseOrderService.updatePurchaseOrder(params.id, body, userId)
    return NextResponse.json(purchaseOrder)
  } catch (error: any) {
    console.error('PUT /api/inventory/purchase-orders/[id] error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update purchase order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    // Cancel the PO instead of deleting (only draft/pending can be cancelled)
    await PurchaseOrderService.cancelPurchaseOrder(params.id, 'Deleted by user', userId)
    return NextResponse.json({ message: 'Purchase order cancelled successfully' })
  } catch (error: any) {
    console.error('DELETE /api/inventory/purchase-orders/[id] error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to cancel purchase order' }, { status: 500 })
  }
}
