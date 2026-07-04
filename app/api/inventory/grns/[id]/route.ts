import { NextRequest, NextResponse } from 'next/server'
import { GRNService } from '@/lib/inventory/grn-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grn = await GRNService.getGRNById(params.id)
    return NextResponse.json(grn)
  } catch (error) {
    console.error('GET /api/inventory/grns/[id] error:', error)
    return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id') || undefined
    const grn = await GRNService.updateGRN(params.id, body, userId)
    return NextResponse.json(grn)
  } catch (error: any) {
    console.error('PUT /api/inventory/grns/[id] error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update GRN' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || undefined
    await GRNService.cancelGRN(params.id, userId)
    return NextResponse.json({ message: 'GRN cancelled successfully' })
  } catch (error: any) {
    console.error('DELETE /api/inventory/grns/[id] error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to cancel GRN' }, { status: 500 })
  }
}
