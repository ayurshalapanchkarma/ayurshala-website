/**
 * Stock Management API - Module 4
 * GET current stock with filters and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(request: NextRequest) {
  try {
    console.log('========== GET /api/inventory/stock START ==========')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const category_uuid = searchParams.get('category_uuid') || ''
    const low_stock_only = searchParams.get('low_stock_only') === 'true'

    console.log('Query params:', { page, pageSize, search, category_uuid, low_stock_only })

    const result = await StockService.getCurrentStock({
      page,
      pageSize,
      search,
      category_uuid,
      low_stock_only,
    })

    console.log('Result count:', result.data.length)
    console.log('Total pages:', result.totalPages)
    console.log('========== GET /api/inventory/stock END (SUCCESS) ==========')
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('========== GET /api/inventory/stock ERROR ==========')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Full error:', error)
    console.error('========== END ERROR ==========')
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch current stock',
        details: {
          type: error?.constructor?.name,
          originalMessage: error?.message,
        }
      }, 
      { status: 500 }
    )
  }
}
