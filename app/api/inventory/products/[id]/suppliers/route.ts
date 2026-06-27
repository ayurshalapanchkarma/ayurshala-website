import { NextResponse } from 'next/server'
import { ProductService } from '@/lib/inventory/product.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const suppliers = await ProductService.getProductSuppliers(id)
    return successResponse(suppliers)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await parseBody(request)
    const link = await ProductService.linkSupplier(id, body as any)
    return successResponse(link, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await parseBody(request)
    const { supplier_id } = body as any

    if (!supplier_id) {
      return NextResponse.json({ error: 'supplier_id is required' }, { status: 400 })
    }

    await ProductService.unlinkSupplier(id, supplier_id)
    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
