import { NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    console.log('[API] GET /api/inventory/products - categoryId:', categoryId)
    const products = await ProductService.getProducts(categoryId ?? undefined)
    console.log('[API] GET /api/inventory/products - success, count:', products.length)
    return successResponse(products)
  } catch (error) {
    console.error('[API] GET /api/inventory/products - error:', error)
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    console.log('[API] POST /api/inventory/products - body:', body)
    const product = await ProductService.createProduct(body as any)
    console.log('[API] POST /api/inventory/products - created:', product.id)
    return successResponse(product, 201)
  } catch (error) {
    console.error('[API] POST /api/inventory/products - error:', error)
    return handleApiError(error)
  }
}
