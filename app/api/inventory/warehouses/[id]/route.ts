import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('[Warehouse GET] Fetching warehouse:', params.id)
    
    const { data, error } = await supabaseAdmin
      .from('inv_warehouses')
      .select('*')
      .eq('uuid', params.id)
      .eq('is_deleted', false)
      .single()

    if (error) {
      console.error('[Warehouse GET] Error:', error)
      throw error
    }
    if (!data) {
      console.warn('[Warehouse GET] Warehouse not found:', params.id)
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching warehouse:', error)
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { warehouse_name, address } = body

    console.log('[Warehouse PUT] Updating warehouse:', params.id, body)

    // Validation
    if (!warehouse_name?.trim()) {
      return NextResponse.json({ error: 'Warehouse name is required', details: { warehouse_name: 'Required' } }, { status: 400 })
    }

    // Check warehouse exists
    const { data: existing } = await supabaseAdmin
      .from('inv_warehouses')
      .select('uuid')
      .eq('uuid', params.id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Check for duplicate name on other warehouses
    const { data: nameExists } = await supabaseAdmin
      .from('inv_warehouses')
      .select('uuid')
      .eq('warehouse_name', warehouse_name.trim())
      .neq('uuid', params.id)
      .eq('is_deleted', false)
      .single()

    if (nameExists) {
      return NextResponse.json(
        { error: 'Warehouse name already exists', details: { warehouse_name: 'Already in use' } },
        { status: 409 }
      )
    }

    const updatePayload = {
      warehouse_name: warehouse_name.trim(),
      address: address?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('inv_warehouses')
      .update(updatePayload)
      .eq('uuid', params.id)
      .select()

    if (error) {
      console.error('[Warehouse PUT] Error:', error)
      throw error
    }

    console.log('[Warehouse PUT] Updated successfully:', data?.[0]?.uuid)
    return NextResponse.json(data?.[0])
  } catch (error: any) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update warehouse' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('========== DELETE ENDPOINT TRACE START ==========')
    console.log('params object:', params)
    console.log('params.id:', params.id)
    console.log('params.id type:', typeof params.id)
    console.log('params.id length:', params.id?.length)
    console.log('params.id === "undefined":', params.id === 'undefined')
    console.log('!params.id:', !params.id)
    
    if (!params.id || params.id === 'undefined' || params.id.trim() === '') {
      console.error('INVALID ID - returning 400')
      console.log('========== DELETE ENDPOINT TRACE END (INVALID) ==========')
      return NextResponse.json({ error: 'Invalid warehouse ID' }, { status: 400 })
    }

    console.log('ID is valid, proceeding with delete...')
    console.log('Supabase query: .from("inv_warehouses").update({is_deleted: true}).eq("uuid", "' + params.id + '")')

    // Soft delete
    const { error } = await supabaseAdmin
      .from('inv_warehouses')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('uuid', params.id)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Delete successful')
    console.log('========== DELETE ENDPOINT TRACE END (SUCCESS) ==========')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Warehouse DELETE] Full error:', error)
    console.log('========== DELETE ENDPOINT TRACE END (ERROR) ==========')
    return NextResponse.json({ error: error?.message || 'Failed to delete warehouse' }, { status: 500 })
  }
}
