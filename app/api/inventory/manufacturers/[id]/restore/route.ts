import { NextRequest, NextResponse } from 'next/server'
import { ManufacturerService } from '@/lib/inventory/manufacturer-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await ManufacturerService.restoreManufacturer(params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error restoring manufacturer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore manufacturer' },
      { status: 500 }
    )
  }
}
