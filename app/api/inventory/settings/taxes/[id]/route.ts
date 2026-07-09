import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('inv_tax_master')
      .select('*')
      .eq('uuid', id)
      .eq('is_active', true)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Tax not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tax:', error)
    return NextResponse.json({ error: 'Failed to fetch tax' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('Update payload:', body)
    
    const { tax_name, hsn_code, tax_percentage, description } = body

    // Validation
    if (!tax_name?.trim()) {
      return NextResponse.json(
        { error: 'Tax name is required', details: { tax_name: 'Tax name is required' } },
        { status: 400 }
      )
    }

    if (tax_percentage === undefined || tax_percentage === null) {
      return NextResponse.json(
        { error: 'Tax percentage is required', details: { tax_percentage: 'Tax percentage is required' } },
        { status: 400 }
      )
    }

    const percentage = parseFloat(tax_percentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: 'Tax percentage must be between 0 and 100', details: { tax_percentage: 'Tax percentage must be between 0 and 100' } },
        { status: 400 }
      )
    }

    // Check tax exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('inv_tax_master')
      .select('uuid')
      .eq('uuid', id)
      .eq('is_active', true)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Tax not found', details: {} }, { status: 404 })
    }

    // Check for duplicate name on other taxes
    if (tax_name?.trim()) {
      const { data: nameExists, error: nameCheckError } = await supabaseAdmin
        .from('inv_tax_master')
        .select('uuid')
        .eq('tax_name', tax_name.trim())
        .neq('uuid', id)
        .eq('is_active', true)
        .single()

      if (nameCheckError && nameCheckError.code !== 'PGRST116') {
        throw new Error(`Database check failed: ${nameCheckError.message}`)
      }

      if (nameExists) {
        return NextResponse.json(
          { error: 'Tax name already exists on another tax', details: { tax_name: `Tax "${tax_name.trim()}" is already in use` } },
          { status: 409 }
        )
      }
    }

    const updateData = {
      tax_name: tax_name.trim(),
      hsn_code: hsn_code?.trim() || null,
      tax_percentage: percentage,
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    }
    
    console.log('Supabase update data:', updateData)

    const { data, error: updateError } = await supabaseAdmin
      .from('inv_tax_master')
      .update(updateData)
      .eq('uuid', id)
      .select()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      throw updateError
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Tax updated but could not retrieve record', details: {} },
        { status: 200 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error updating tax:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to update tax: ${errorMessage}`, details: {} },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check tax exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('inv_tax_master')
      .select('uuid')
      .eq('uuid', id)
      .eq('is_active', true)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Tax not found', details: {} }, { status: 404 })
    }

    // Soft delete (set is_active to false)
    const { error: deleteError } = await supabaseAdmin
      .from('inv_tax_master')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('uuid', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tax:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to delete tax: ${errorMessage}`, details: {} },
      { status: 500 }
    )
  }
}
