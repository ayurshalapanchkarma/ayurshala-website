import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await ProductService.restoreProduct(params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error restoring product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore product' },
      { status: 500 }
    )
  }
}
