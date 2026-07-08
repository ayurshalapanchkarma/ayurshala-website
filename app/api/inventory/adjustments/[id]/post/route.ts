/**
 * Post Stock Adjustment API
 * Applies the adjustment to inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || undefined
    const adjustment = await StockService.postAdjustment(id, userId)
    return NextResponse.json(adjustment)
  } catch (error: any) {
    console.error('POST /api/inventory/adjustments/[id]/post error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to post adjustment' },
      { status: 500 }
    )
  }
}
