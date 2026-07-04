import { NextRequest, NextResponse } from 'next/server'
import { PharmacyBillService } from '@/lib/inventory/pharmacy-bill-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id')

    const payment = await PharmacyBillService.recordPayment(
      params.id,
      body,
      userId || undefined
    )

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/pharmacy/bills/[id]/payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    )
  }
}
