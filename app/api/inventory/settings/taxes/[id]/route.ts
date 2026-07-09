import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('tax_masters')
      .select('*')
      .eq('uuid', id)
      .eq('is_deleted', false)
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
    const { tax_name, tax_code, tax_rate, tax_type, description } = body

    // Validation
    if (!tax_name?.trim()) {
      return NextResponse.json(
        { error: 'Tax name is required', details: { tax_name: 'Tax name is required' } },
        { status: 400 }
      )
    }

    if (tax_rate === undefined || tax_rate === null) {
      return NextResponse.json(
        { error: 'Tax rate is required', details: { tax_rate: 'Tax rate is required' } },
        { status: 400 }
      )
    }

    const rate = parseFloat(tax_rate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100', details: { tax_rate: 'Tax rate must be between 0 and 100' } },
        { status: 400 }
      )
    }

    if (!tax_type || !['GST', 'VAT', 'SALES_TAX', 'OTHER'].includes(tax_type)) {
      return NextResponse.json(
        { error: 'Invalid or missing tax type', details: { tax_type: 'Valid tax type is required' } },
        { status: 400 }
      )
    }

    // Check tax exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('tax_masters')
      .select('uuid')
      .eq('uuid', id)
      .eq('is_deleted', false)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Tax not found', details: {} }, { status: 404 })
    }

    // Check for duplicate code on other taxes
    if (tax_code?.trim()) {
      const trimmedCode = tax_code.trim()
      const { data: codeExists, error: codeCheckError } = await supabaseAdmin
        .from('tax_masters')
        .select('uuid')
        .eq('tax_code', trimmedCode)
        .neq('uuid', id)
        .eq('is_deleted', false)
        .single()

      if (codeCheckError && codeCheckError.code !== 'PGRST116') {
        throw new Error(`Database check failed: ${codeCheckError.message}`)
      }

      if (codeExists) {
        return NextResponse.json(
          { error: 'Tax code already exists on another tax', details: { tax_code: `Tax code "${trimmedCode}" is already in use` } },
          { status: 409 }
        )
      }
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('tax_masters')
      .update({
        tax_name: tax_name.trim(),
        tax_code: tax_code?.trim() || null,
        tax_rate: rate,
        tax_type,
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
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
      .from('tax_masters')
      .select('uuid')
      .eq('uuid', id)
      .eq('is_deleted', false)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Tax not found', details: {} }, { status: 404 })
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('tax_masters')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
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
