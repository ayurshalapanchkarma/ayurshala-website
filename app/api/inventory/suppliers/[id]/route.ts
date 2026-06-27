import { NextResponse } from 'next/server'
import { SupplierService } from '@/lib/inventory/supplier.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supplier = await SupplierService.getSupplierById(id)
    return successResponse(supplier)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await parseBody(request)
    const supplier = await SupplierService.updateSupplier(id, body as any)
    return successResponse(supplier)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await SupplierService.deleteSupplier(id)
    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
