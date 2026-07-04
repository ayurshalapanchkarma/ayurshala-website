import { NextRequest, NextResponse } from 'next/server'
import { UnitService } from '@/lib/inventory/unit-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const options = {
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: (searchParams.get('sortBy') || 'name') as any,
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
    }

    const result = await UnitService.getUnits(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { error: 'Failed to fetch units' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const result = await UnitService.createUnit(input)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create unit' },
      { status: 500 }
    )
  }
}
