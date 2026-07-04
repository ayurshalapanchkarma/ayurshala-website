import { NextRequest, NextResponse } from 'next/server'
import { PharmacyReturnService } from '@/lib/inventory/pharmacy-return-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const result = await PharmacyReturnService.getReturns({
      page,
      pageSize,
      dateFrom,
      dateTo,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GET /api/pharmacy/returns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id')

    const billReturn = await PharmacyReturnService.createReturn(body, userId || undefined)

    return NextResponse.json(billReturn, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/pharmacy/returns error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create return' },
      { status: 500 }
    )
  }
}
