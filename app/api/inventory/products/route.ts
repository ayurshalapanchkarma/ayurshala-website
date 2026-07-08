import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const options = {
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: (searchParams.get('sortBy') || 'product_name') as any,
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
      categoryId: searchParams.get('categoryId') || undefined,
      manufacturerId: searchParams.get('manufacturerId') || undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const result = await ProductService.getProducts(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    console.log('[Product POST] Received input:', JSON.stringify(input, null, 2))
    
    const result = await ProductService.createProduct(input)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('[Product POST] Error caught:', {
      type: error.constructor.name,
      message: error.message,
      errors: error.errors,
      stack: error.stack
    })
    
    if (error instanceof ValidationError) {
      console.error('[Product POST] Validation errors:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors,
          fieldErrors: Object.entries(error.errors).map(([field, msg]) => `${field}: ${msg}`).join('; ')
        },
        { status: 400 }
      )
    }
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product', details: error.message },
      { status: 500 }
    )
  }
}
