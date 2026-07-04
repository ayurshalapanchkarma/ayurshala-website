import { NextRequest, NextResponse } from 'next/server'
import { SupplierService } from '@/lib/inventory/supplier-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await SupplierService.restoreSupplier(id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error restoring supplier:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore supplier' },
      { status: 500 }
    )
  }
}
