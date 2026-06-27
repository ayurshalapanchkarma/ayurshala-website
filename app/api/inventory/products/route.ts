import { NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    const products = await ProductService.getProducts(categoryId ?? undefined)
    return successResponse(products)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const product = await ProductService.createProduct(body as any)
    return successResponse(product, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
