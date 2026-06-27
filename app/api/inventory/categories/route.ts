import { NextResponse } from 'next/server'
import { CategoryService } from '@/lib/inventory/category.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    const categories = await CategoryService.getCategories()
    return successResponse(categories)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const category = await CategoryService.createCategory(body as any)
    return successResponse(category, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
