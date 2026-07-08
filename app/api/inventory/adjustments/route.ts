/**
 * Stock Adjustments API - Module 5
 * List and create stock adjustments
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(request: NextRequest) {
  try {
    console.log('========== GET /api/inventory/adjustments START ==========')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const reason = searchParams.get('reason') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    console.log('Query params:', { page, pageSize, search, status, reason, dateFrom, dateTo })

    const result = await StockService.getAdjustments({
      page,
      pageSize,
      search,
      status,
      reason,
      dateFrom,
      dateTo,
    })

    console.log('Result count:', result.data?.length)
    console.log('========== GET /api/inventory/adjustments END (SUCCESS) ==========')
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('========== GET /api/inventory/adjustments ERROR ==========')
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stock adjustments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('========== POST /api/inventory/adjustments START ==========')
    
    const body = await request.json()
    console.log('Request payload:', JSON.stringify(body, null, 2))
    
    const userId = request.headers.get('x-user-id') || undefined
    console.log('User ID:', userId)

    console.log('Calling StockService.createAdjustment...')
    const adjustment = await StockService.createAdjustment(body, userId)

    console.log('Adjustment created:', adjustment)
    console.log('========== POST /api/inventory/adjustments END (SUCCESS) ==========')
    
    return NextResponse.json(adjustment, { status: 201 })
  } catch (error: any) {
    console.error('========== POST /api/inventory/adjustments ERROR ==========')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error details:', error?.details)
    console.error('Full error:', error)
    console.error('========== END ERROR ==========')

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create stock adjustment',
        details: {
          type: error?.constructor?.name,
          originalMessage: error?.message,
          errors: error?.errors,
        }
      },
      { status: 500 }
    )
  }
}
