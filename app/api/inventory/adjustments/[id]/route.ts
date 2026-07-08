/**
 * Stock Adjustments Detail API
 * Get, update, delete individual adjustments
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('========== GET /api/inventory/adjustments/[id] START ==========')
    console.log('Adjustment ID:', id)

    const adjustment = await StockService.getAdjustmentById(id)

    if (!adjustment) {
      return NextResponse.json(
        { error: 'Stock adjustment not found' },
        { status: 404 }
      )
    }

    console.log('Adjustment found:', adjustment.uuid)
    console.log('========== GET /api/inventory/adjustments/[id] END (SUCCESS) ==========')

    return NextResponse.json({ data: adjustment })
  } catch (error: any) {
    console.error('========== GET /api/inventory/adjustments/[id] ERROR ==========')
    console.error('Error:', error?.message)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch stock adjustment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('========== PUT /api/inventory/adjustments/[id] START ==========')
    console.log('Adjustment ID:', id)

    const body = await request.json()
    console.log('Update payload:', JSON.stringify(body, null, 2))

    const userId = request.headers.get('x-user-id') || undefined
    console.log('User ID:', userId)

    // Check if adjustment exists and is draft
    const existing = await StockService.getAdjustmentById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Stock adjustment not found' },
        { status: 404 }
      )
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft adjustments can be edited' },
        { status: 400 }
      )
    }

    // Delete old items and create new ones
    console.log('Updating adjustment...')
    const adjustment = await StockService.updateAdjustment(id, body, userId)

    console.log('Adjustment updated:', adjustment.uuid)
    console.log('========== PUT /api/inventory/adjustments/[id] END (SUCCESS) ==========')

    return NextResponse.json({ data: adjustment })
  } catch (error: any) {
    console.error('========== PUT /api/inventory/adjustments/[id] ERROR ==========')
    console.error('Error:', error?.message)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to update stock adjustment',
        details: {
          type: error?.constructor?.name,
          originalMessage: error?.message,
        }
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('========== DELETE /api/inventory/adjustments/[id] START ==========')
    console.log('Adjustment ID:', id)

    // Check if adjustment exists and is draft
    const existing = await StockService.getAdjustmentById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Stock adjustment not found' },
        { status: 404 }
      )
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft adjustments can be deleted' },
        { status: 400 }
      )
    }

    console.log('Deleting adjustment...')
    await StockService.deleteAdjustment(id)

    console.log('Adjustment deleted')
    console.log('========== DELETE /api/inventory/adjustments/[id] END (SUCCESS) ==========')

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    console.error('========== DELETE /api/inventory/adjustments/[id] ERROR ==========')
    console.error('Error:', error?.message)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete stock adjustment' },
      { status: 500 }
    )
  }
}
