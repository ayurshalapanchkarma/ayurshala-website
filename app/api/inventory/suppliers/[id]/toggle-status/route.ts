import { NextRequest, NextResponse } from 'next/next'
import { SupplierService } from '@/lib/inventory/supplier-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await SupplierService.toggleSupplierStatus(params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error toggling supplier status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle status' },
      { status: 500 }
    )
  }
}
