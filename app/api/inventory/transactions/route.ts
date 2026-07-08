/**
 * Stock Transactions API
 * Complete inventory movement history with filtering, searching, and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface StockTransaction {
  uuid: string
  created_at: string
  movement_type: string
  quantity: number
  before_stock: number
  after_stock: number
  reference_type?: string
  reference_uuid?: string
  remarks?: string
  product_code: string
  product_name: string
  batch_number?: string
  unit_name?: string
  created_by_name?: string
}

interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase configuration missing')
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    console.log('========== GET /api/inventory/transactions START ==========')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const movement_type = searchParams.get('movement_type') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const product_uuid = searchParams.get('product_uuid') || ''
    const batch_uuid = searchParams.get('batch_uuid') || ''

    console.log('Query params:', {
      page,
      pageSize,
      search,
      movement_type,
      dateFrom,
      dateTo,
      product_uuid,
      batch_uuid,
    })

    // Build query with joins
    let countQuery = getSupabase()
      .from('inv_stock_movements')
      .select('uuid', { count: 'exact', head: true })

    let dataQuery = getSupabase()
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
        remarks,
        product:inv_products(product_code, product_name, unit:inv_units(name)),
        batch:inv_product_batches(batch_number),
        created_by:auth.users(email)
      `)

    // Apply filters
    if (movement_type) {
      countQuery = countQuery.eq('movement_type', movement_type)
      dataQuery = dataQuery.eq('movement_type', movement_type)
    }

    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom + 'T00:00:00Z')
      dataQuery = dataQuery.gte('created_at', dateFrom + 'T00:00:00Z')
    }

    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo + 'T23:59:59Z')
      dataQuery = dataQuery.lte('created_at', dateTo + 'T23:59:59Z')
    }

    if (product_uuid) {
      countQuery = countQuery.eq('product_uuid', product_uuid)
      dataQuery = dataQuery.eq('product_uuid', product_uuid)
    }

    if (batch_uuid) {
      countQuery = countQuery.eq('batch_uuid', batch_uuid)
      dataQuery = dataQuery.eq('batch_uuid', batch_uuid)
    }

    console.log('Fetching count...')
    const { count, error: countErr } = await countQuery

    if (countErr) {
      console.error('Count error:', countErr)
      throw countErr
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    console.log('Total records:', total)

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    dataQuery = dataQuery.order('created_at', { ascending: false }).range(from, to)

    console.log('Fetching data with pagination:', { from, to })
    const { data, error } = await dataQuery

    if (error) {
      console.error('Data fetch error:', error)
      throw error
    }

    console.log('Records fetched:', data?.length)

    // Handle search in application (if needed for multi-field search)
    let results = (data || []) as any[]

    if (search) {
      const searchLower = search.toLowerCase()
      results = results.filter(
        (tx) =>
          tx.product?.product_code?.toLowerCase().includes(searchLower) ||
          tx.product?.product_name?.toLowerCase().includes(searchLower) ||
          tx.batch?.batch_number?.toLowerCase().includes(searchLower) ||
          tx.remarks?.toLowerCase().includes(searchLower)
      )
    }

    // Transform to response format
    const transactions: StockTransaction[] = results.map((tx: any) => ({
      uuid: tx.uuid,
      created_at: tx.created_at,
      movement_type: tx.movement_type,
      quantity: tx.quantity,
      before_stock: tx.before_stock,
      after_stock: tx.after_stock,
      reference_type: tx.reference_type,
      reference_uuid: tx.reference_uuid,
      remarks: tx.remarks,
      product_code: tx.product?.product_code || '',
      product_name: tx.product?.product_name || '',
      batch_number: tx.batch?.batch_number,
      unit_name: tx.product?.unit?.name || '',
      created_by_name: tx.created_by?.email || 'System',
    }))

    console.log('========== GET /api/inventory/transactions END (SUCCESS) ==========')

    return NextResponse.json({
      data: transactions,
      total,
      page,
      pageSize,
      totalPages,
    } as ListResponse<StockTransaction>)
  } catch (error: any) {
    console.error('========== GET /api/inventory/transactions ERROR ==========')
    console.error('Error:', error?.message)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch transactions',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
