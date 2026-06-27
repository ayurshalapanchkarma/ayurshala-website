import { NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await ProductService.getProductById(id)
    const suppliers = await ProductService.getProductSuppliers(id)

    return successResponse({
      ...product,
      suppliers,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await parseBody(request)
    const product = await ProductService.updateProduct(id, body as any)
    return successResponse(product)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ProductService.deleteProduct(id)
    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
