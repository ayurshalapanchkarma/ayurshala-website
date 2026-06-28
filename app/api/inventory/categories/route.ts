import { NextResponse } from 'next/server'
import { CategoryService } from '@/lib/inventory/category.service'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function GET() {
  try {
    console.log('[API] GET /api/inventory/categories')
    const categories = await CategoryService.getCategories()
    console.log('[API] GET /api/inventory/categories - success, count:', categories.length)
    return successResponse(categories)
  } catch (error) {
    console.error('[API] GET /api/inventory/categories - error:', error)
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    console.log('[API] POST /api/inventory/categories - body:', body)
    const category = await CategoryService.createCategory(body as any)
    console.log('[API] POST /api/inventory/categories - created:', category.id)
    return successResponse(category, 201)
  } catch (error) {
    console.error('[API] POST /api/inventory/categories - error:', error)
    return handleApiError(error)
  }
}
