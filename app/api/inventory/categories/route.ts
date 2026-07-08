import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/inventory/category-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const options = {
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: (searchParams.get('sortBy') || 'display_order') as any,
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const result = await CategoryService.getCategories(options)
    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error fetching categories:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const result = await CategoryService.createCategory(input)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}
