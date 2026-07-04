import { NextRequest, NextResponse } from 'next/server'
import { PharmacyBillService } from '@/lib/inventory/pharmacy-bill-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bill = await PharmacyBillService.getBillById(params.id)
    return NextResponse.json(bill)
  } catch (error: any) {
    console.error('GET /api/pharmacy/bills/[id] error:', error)
    return NextResponse.json(
      { error: 'Bill not found' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id')

    const bill = await PharmacyBillService.updateBillItems(
      params.id,
      body.items,
      userId || undefined
    )

    return NextResponse.json(bill)
  } catch (error: any) {
    console.error('PUT /api/pharmacy/bills/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update bill' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id')
    const { reason } = body

    await PharmacyBillService.cancelBill(params.id, reason, userId || undefined)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/pharmacy/bills/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel bill' },
      { status: 500 }
    )
  }
}
