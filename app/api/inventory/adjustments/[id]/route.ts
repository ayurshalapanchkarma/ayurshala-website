/**
 * Stock Adjustment Detail API
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adjustment = await StockService.getAdjustmentById(params.id)
    return NextResponse.json(adjustment)
  } catch (error) {
    console.error('GET /api/inventory/adjustments/[id] error:', error)
    return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 })
  }
}
