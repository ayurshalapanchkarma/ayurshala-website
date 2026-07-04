import { NextRequest, NextResponse } from 'next/server'
import { UnitService } from '@/lib/inventory/unit-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await UnitService.toggleUnitStatus(params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error toggling unit status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle status' },
      { status: 500 }
    )
  }
}
