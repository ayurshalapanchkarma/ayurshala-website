import { NextResponse } from 'next/server'
import { SupplierService } from '@/lib/inventory/supplier.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    const suppliers = activeOnly
      ? await SupplierService.getActiveSuppliers()
      : await SupplierService.getSuppliers()

    return successResponse(suppliers)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const supplier = await SupplierService.createSupplier(body as any)
    return successResponse(supplier, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
