import { NextRequest, NextResponse } from 'next/server'
import { ManufacturerService } from '@/lib/inventory/manufacturer-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const mfr = await ManufacturerService.getManufacturerById(id)
    return NextResponse.json(mfr)
  } catch (error: any) {
    console.error('Error fetching manufacturer:', error)
    return NextResponse.json(
      { error: error.message || 'Manufacturer not found' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const input = await request.json()
    const result = await ManufacturerService.updateManufacturer(id, input)
    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating manufacturer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update manufacturer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await ManufacturerService.deleteManufacturer(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting manufacturer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete manufacturer' },
      { status: 500 }
    )
  }
}
