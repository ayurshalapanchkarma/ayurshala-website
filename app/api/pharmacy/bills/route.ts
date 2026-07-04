import { NextRequest, NextResponse } from 'next/server'
import { PharmacyBillService } from '@/lib/inventory/pharmacy-bill-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const patient_uuid = searchParams.get('patient_uuid') || ''
    const cashier_uuid = searchParams.get('cashier_uuid') || ''

    const result = await PharmacyBillService.getBills({
      page,
      pageSize,
      search,
      status,
      dateFrom,
      dateTo,
      patient_uuid,
      cashier_uuid,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GET /api/pharmacy/bills error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.headers.get('x-user-id')

    const bill = await PharmacyBillService.createBill(body, userId || undefined)

    return NextResponse.json(bill, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/pharmacy/bills error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bill' },
      { status: 500 }
    )
  }
}
