import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/inventory/category-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await CategoryService.toggleCategoryStatus(id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error toggling category status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle status' },
      { status: 500 }
    )
  }
}
