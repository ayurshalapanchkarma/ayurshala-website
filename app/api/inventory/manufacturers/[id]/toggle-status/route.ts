import { NextRequest, NextResponse } from 'next/server'
import { ManufacturerService } from '@/lib/inventory/manufacturer-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await ManufacturerService.toggleManufacturerStatus(id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error toggling manufacturer status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle status' },
      { status: 500 }
    )
  }
}
