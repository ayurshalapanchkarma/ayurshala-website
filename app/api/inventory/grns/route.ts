import { NextRequest, NextResponse } from 'next/server'
import { GRNService } from '@/lib/inventory/grn-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const supplier_uuid = searchParams.get('supplier_uuid') || ''
    const purchase_order_uuid = searchParams.get('purchase_order_uuid') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const result = await GRNService.getGRNs({
      page,
      pageSize,
      search,
      status: status as any,
      supplier_uuid,
      purchase_order_uuid,
      dateFrom,
      dateTo,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/inventory/grns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GRNs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id') || undefined

    const grn = await GRNService.createGRN(body, userId)

    return NextResponse.json(grn, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/inventory/grns error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create GRN' },
      { status: 500 }
    )
  }
}
