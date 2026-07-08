import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const offset = (page - 1) * pageSize

    let query = supabaseAdmin
      .from('inv_warehouses')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (search) {
      // Only search on columns that exist: warehouse_name, address
      query = query.or(`warehouse_name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) throw error

    console.log('[Warehouse GET] Returned first row:', JSON.stringify(data?.[0], null, 2))

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[Warehouse POST] Received payload:', JSON.stringify(body, null, 2))
    
    const { warehouse_name, address } = body

    // Validation
    if (!warehouse_name?.trim()) {
      return NextResponse.json({ error: 'Warehouse name is required', details: { warehouse_name: 'Required' } }, { status: 400 })
    }

    // Check for duplicate name
    const { data: existing } = await supabaseAdmin
      .from('inv_warehouses')
      .select('uuid')
      .eq('warehouse_name', warehouse_name.trim())
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Warehouse name already exists', details: { warehouse_name: 'Already in use' } },
        { status: 409 }
      )
    }

    const insertPayload = {
      warehouse_name: warehouse_name.trim(),
      address: address?.trim() || null,
      is_active: true,
      is_deleted: false,
    }
    
    console.log('[Warehouse POST] Insert payload:', JSON.stringify(insertPayload, null, 2))

    const { data, error } = await supabaseAdmin.from('inv_warehouses').insert(insertPayload).select()

    if (error) {
      console.error('[Warehouse POST] Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status
      })
      throw error
    }

    console.log('[Warehouse POST] Created successfully:', data?.[0]?.uuid)
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('[Warehouse POST] Full error object:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      status: error?.status,
      stack: error?.stack
    })
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create warehouse',
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      }, 
      { status: 500 }
    )
  }
}
