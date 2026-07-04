/**
 * Stock Movements API
 * Track all inventory movements
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const product_uuid = searchParams.get('product_uuid') || ''
    const batch_uuid = searchParams.get('batch_uuid') || ''
    const movement_type = searchParams.get('movement_type') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const result = await StockService.getStockMovements({
      product_uuid,
      batch_uuid,
      movement_type,
      page,
      pageSize,
      dateFrom,
      dateTo,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/inventory/stock-movements error:', error)
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
  }
}
