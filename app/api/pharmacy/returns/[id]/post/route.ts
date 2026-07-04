import { NextRequest, NextResponse } from 'next/server'
import { PharmacyReturnService } from '@/lib/inventory/pharmacy-return-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')

    const billReturn = await PharmacyReturnService.postReturn(params.id, userId || undefined)

    return NextResponse.json(billReturn)
  } catch (error: any) {
    console.error('POST /api/pharmacy/returns/[id]/post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process return' },
      { status: 500 }
    )
  }
}
