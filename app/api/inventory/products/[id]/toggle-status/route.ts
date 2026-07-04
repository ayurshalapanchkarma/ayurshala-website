import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await ProductService.toggleProductStatus(id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error toggling product status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle status' },
      { status: 500 }
    )
  }
}
