import { NextRequest, NextResponse } from 'next/server'
import { PurchaseOrderService } from '@/lib/inventory/purchase-order-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const supplier_uuid = searchParams.get('supplier_uuid') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const result = await PurchaseOrderService.getPurchaseOrders({
      page,
      pageSize,
      search,
      status,
      supplier_uuid,
      dateFrom,
      dateTo,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/inventory/purchase-orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id') // From auth middleware

    const purchaseOrder = await PurchaseOrderService.createPurchaseOrder(body, userId)

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/inventory/purchase-orders error:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}
