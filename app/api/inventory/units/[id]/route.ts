import { NextRequest, NextResponse } from 'next/server'
import { UnitService } from '@/lib/inventory/unit-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await UnitService.getUnitById(params.id)
    return NextResponse.json(unit)
  } catch (error: any) {
    console.error('Error fetching unit:', error)
    return NextResponse.json(
      { error: error.message || 'Unit not found' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const input = await request.json()
    const result = await UnitService.updateUnit(params.id, input)
    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update unit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await UnitService.toggleUnitStatus(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete unit' },
      { status: 500 }
    )
  }
}
