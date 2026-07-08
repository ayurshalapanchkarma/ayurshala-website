/**
 * Stock Ledger API
 * Product-wise running ledger with opening/closing balances
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface LedgerItem {
  date: string
  voucher_type?: string
  reference?: string
  transaction_type: string
  batch_number?: string
  opening_qty: number
  qty_in: number
  qty_out: number
  closing_qty: number
  unit_cost: number
  running_value: number
  user: string
}

interface LedgerResponse {
  product_code: string
  product_name: string
  unit_name: string
  from_date: string
  to_date: string
  opening_stock: number
  stock_in: number
  stock_out: number
  closing_stock: number
  current_value: number
  ledger: LedgerItem[]
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase configuration missing')
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    console.log('========== GET /api/inventory/stock-ledger START ==========')

    const { searchParams } = new URL(request.url)
    const product_uuid = searchParams.get('product_uuid') || ''
    const batch_uuid = searchParams.get('batch_uuid') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    console.log('Query params:', {
      product_uuid,
      batch_uuid,
      dateFrom,
      dateTo,
      page,
      pageSize,
    })

    if (!product_uuid) {
      return NextResponse.json(
        { error: 'product_uuid is required' },
        { status: 400 }
      )
    }

    // Fetch product details
    console.log('Fetching product...')
    const { data: product, error: prodErr } = await getSupabase()
      .from('inv_products')
      .select('product_code, product_name, unit:inv_units(name)')
      .eq('uuid', product_uuid)
      .single()

    if (prodErr || !product) {
      console.error('Product fetch error:', prodErr)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch all movements for this product (for opening balance calculation)
    console.log('Fetching all movements for product...')
    let allMovementsQuery = getSupabase()
      .from('inv_stock_movements')
      .select(`
        uuid,
        created_at,
        movement_type,
        quantity,
        before_stock,
        after_stock,
        reference_type,
        reference_uuid,
        batch:inv_product_batches(batch_number),
        created_by:auth.users(email)
      `)
      .eq('product_uuid', product_uuid)

    if (batch_uuid) {
      allMovementsQuery = allMovementsQuery.eq('batch_uuid', batch_uuid)
    }

    const { data: allMovements, error: moveErr } = await allMovementsQuery.order('created_at', { ascending: true })

    if (moveErr) {
      console.error('Movement fetch error:', moveErr)
      throw moveErr
    }

    console.log('All movements:', allMovements?.length)

    // Determine opening balance (first movement's before_stock if exists, else 0)
    let openingStock = 0
    if (allMovements && allMovements.length > 0) {
      openingStock = (allMovements[0] as any).before_stock || 0
    }

    // Filter movements by date range for display
    let filteredMovements = allMovements || []

    if (dateFrom) {
      filteredMovements = filteredMovements.filter(
        (m: any) => new Date(m.created_at) >= new Date(dateFrom)
      )
    }

    if (dateTo) {
      filteredMovements = filteredMovements.filter(
        (m: any) => new Date(m.created_at) <= new Date(dateTo + 'T23:59:59Z')
      )
    }

    console.log('Filtered movements:', filteredMovements.length)

    // Build ledger items
    let runningBalance = openingStock
    let totalIn = 0
    let totalOut = 0

    const ledgerItems: LedgerItem[] = filteredMovements.map((movement: any, index: number) => {
      const isInMovement = [
        'PURCHASE',
        'RETURN',
        'ADJUSTMENT',
        'TRANSFER_IN',
      ].includes(movement.movement_type)

      const qtyIn = isInMovement ? movement.quantity : 0
      const qtyOut = !isInMovement ? movement.quantity : 0

      if (isInMovement) totalIn += qtyIn
      if (!isInMovement) totalOut += qtyOut

      // Calculate unit cost from movement or batch
      const unitCost = 0 // Would need to get from batch or movement source

      const item: LedgerItem = {
        date: new Date(movement.created_at).toLocaleDateString(),
        voucher_type: movement.reference_type,
        reference: movement.reference_uuid,
        transaction_type: movement.movement_type,
        batch_number: movement.batch?.batch_number,
        opening_qty: index === 0 ? openingStock : runningBalance,
        qty_in: qtyIn,
        qty_out: qtyOut,
        closing_qty: movement.after_stock,
        unit_cost: unitCost,
        running_value: movement.after_stock * unitCost,
        user: movement.created_by?.email || 'System',
      }

      runningBalance = movement.after_stock

      return item
    })

    // Apply pagination
    const startIdx = (page - 1) * pageSize
    const endIdx = startIdx + pageSize
    const paginatedLedger = ledgerItems.slice(startIdx, endIdx)

    // Calculate closing stock from last movement
    const closingStock =
      filteredMovements.length > 0
        ? (filteredMovements[filteredMovements.length - 1] as any).after_stock
        : openingStock

    const response: LedgerResponse = {
      product_code: (product as any).product_code,
      product_name: (product as any).product_name,
      unit_name: (product as any).unit?.name || '',
      from_date: dateFrom || 'Beginning',
      to_date: dateTo || 'Today',
      opening_stock: openingStock,
      stock_in: totalIn,
      stock_out: totalOut,
      closing_stock: closingStock,
      current_value: closingStock * 0, // Would need unit cost
      ledger: paginatedLedger,
    }

    console.log('========== GET /api/inventory/stock-ledger END (SUCCESS) ==========')

    return NextResponse.json({
      data: response,
      total: ledgerItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(ledgerItems.length / pageSize),
    })
  } catch (error: any) {
    console.error('========== GET /api/inventory/stock-ledger ERROR ==========')
    console.error('Error:', error?.message)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch stock ledger',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
