import { NextRequest, NextResponse } from 'next/server'
import { SupplierService } from '@/lib/inventory/supplier-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supplier = await SupplierService.getSupplierById(id)
    return NextResponse.json(supplier)
  } catch (error: any) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: error.message || 'Supplier not found' },
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
    const result = await SupplierService.updateSupplier(id, input)
    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update supplier' },
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
    await SupplierService.deleteSupplier(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
