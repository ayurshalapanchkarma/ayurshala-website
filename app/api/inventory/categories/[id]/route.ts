import { NextResponse } from 'next/server'
import { CategoryService } from '@/lib/inventory/category.service'
import { handleApiError, successResponse, parseBody, getParam } from '@/lib/inventory/api-helper'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const category = await CategoryService.getCategoryById(id)
    return successResponse(category)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await parseBody(request)
    const category = await CategoryService.updateCategory(id, body as any)
    return successResponse(category)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await CategoryService.deleteCategory(id)
    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
