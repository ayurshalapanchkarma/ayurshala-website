import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await ProductService.restoreProduct(id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error restoring product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore product' },
      { status: 500 }
    )
  }
}
