import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/inventory/category-service-v2'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await CategoryService.restoreCategory(id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error restoring category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore category' },
      { status: 500 }
    )
  }
}
