/**
 * Stock Management API - Module 4
 * GET current stock with filters and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const category_uuid = searchParams.get('category_uuid') || ''
    const low_stock_only = searchParams.get('low_stock_only') === 'true'

    const result = await StockService.getCurrentStock({
      page,
      pageSize,
      search,
      category_uuid,
      low_stock_only,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/inventory/stock error:', error)
    return NextResponse.json({ error: 'Failed to fetch current stock' }, { status: 500 })
  }
}
