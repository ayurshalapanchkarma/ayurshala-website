import { NextRequest, NextResponse } from 'next/server'
import { GRNService } from '@/lib/inventory/grn-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    const grn = await GRNService.postGRN(params.id, userId)
    return NextResponse.json(grn)
  } catch (error: any) {
    console.error('POST /api/inventory/grns/[id]/post error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to post GRN' },
      { status: 500 }
    )
  }
}
