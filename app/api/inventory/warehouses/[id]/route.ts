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
    // STEP 2: Log exactly what we received from Next.js
    console.log('===== DELETE API ENDPOINT =====')
    console.log('Full params:', JSON.stringify(params))
    console.log('params.id:', params.id)
    console.log('typeof params.id:', typeof params.id)

    // DO NOT VALIDATE YET - just log and proceed
    console.log('Proceeding to delete with id:', params.id)

    // Soft delete using uuid (the actual primary key)
    const { data, error } = await supabaseAdmin
      .from('inv_warehouses')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('uuid', params.id)
      .select()

    console.log('Supabase delete result:', { 
      rowsUpdated: data?.length,
      error: error?.message
    })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Delete successful')
    console.log('===== DELETE API ENDPOINT END (SUCCESS) =====')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('===== DELETE API ENDPOINT ERROR =====')
    console.error('Error message:', error?.message)
    console.log('===== DELETE API ENDPOINT END (ERROR) =====')
    return NextResponse.json({ error: error?.message || 'Failed to delete warehouse' }, { status: 500 })
  }
}
