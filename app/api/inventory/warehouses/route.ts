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
      .from('warehouses')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`warehouse_name.ilike.%${search}%,warehouse_code.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) throw error

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
    const { warehouse_code, warehouse_name, location, address, city, state, pincode, contact_person, phone, email } = body

    // Validation
    if (!warehouse_name?.trim()) {
      return NextResponse.json({ error: 'Warehouse name is required', details: { warehouse_name: 'Required' } }, { status: 400 })
    }

    if (!location?.trim()) {
      return NextResponse.json({ error: 'Location is required', details: { location: 'Required' } }, { status: 400 })
    }

    // Check for duplicate code if provided
    if (warehouse_code) {
      const { data: existing } = await supabaseAdmin
        .from('warehouses')
        .select('uuid')
        .eq('warehouse_code', warehouse_code)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Warehouse code already exists', details: { warehouse_code: 'Already in use' } },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabaseAdmin.from('warehouses').insert({
      warehouse_code: warehouse_code || `WH${Date.now()}`,
      warehouse_name: warehouse_name.trim(),
      location: location.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      pincode: pincode?.trim() || null,
      contact_person: contact_person?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      is_active: true,
      is_deleted: false,
    }).select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error('Error creating warehouse:', error)
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 })
  }
}
