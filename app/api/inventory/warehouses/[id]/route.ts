import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .select('*')
      .eq('uuid', params.id)
      .eq('is_deleted', false)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching warehouse:', error)
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Check warehouse exists
    const { data: existing } = await supabaseAdmin
      .from('warehouses')
      .select('uuid')
      .eq('uuid', params.id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Check for duplicate code on other warehouses
    if (warehouse_code) {
      const { data: codeExists } = await supabaseAdmin
        .from('warehouses')
        .select('uuid')
        .eq('warehouse_code', warehouse_code)
        .neq('uuid', params.id)
        .eq('is_deleted', false)
        .single()

      if (codeExists) {
        return NextResponse.json(
          { error: 'Warehouse code already exists', details: { warehouse_code: 'Already in use' } },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .update({
        warehouse_code,
        warehouse_name: warehouse_name.trim(),
        location: location.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        contact_person: contact_person?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('uuid', params.id)
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check warehouse exists
    const { data: existing } = await supabaseAdmin
      .from('warehouses')
      .select('uuid')
      .eq('uuid', params.id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('warehouses')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('uuid', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting warehouse:', error)
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 })
  }
}
