import { NextRequest, NextResponse } from 'next/server'
import { PharmacyBillService } from '@/lib/inventory/pharmacy-bill-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')

    const bill = await PharmacyBillService.completeSale(params.id, userId || undefined)

    return NextResponse.json(bill)
  } catch (error: any) {
    console.error('POST /api/pharmacy/bills/[id]/complete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete sale' },
      { status: 500 }
    )
  }
}
