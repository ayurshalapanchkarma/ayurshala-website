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
      return NextResponse.json({ error: 'Tax name is required', details: { tax_name: 'Required' } }, { status: 400 })
    }

    if (tax_rate === undefined || tax_rate === null) {
      return NextResponse.json({ error: 'Tax rate is required', details: { tax_rate: 'Required' } }, { status: 400 })
    }

    const rate = parseFloat(tax_rate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100', details: { tax_rate: 'Must be 0-100' } },
        { status: 400 }
      )
    }

    if (!['GST', 'VAT', 'SALES_TAX', 'OTHER'].includes(tax_type)) {
      return NextResponse.json(
        { error: 'Invalid tax type', details: { tax_type: 'Invalid' } },
        { status: 400 }
      )
    }

    // Check tax exists
    const { data: existing } = await supabaseAdmin
      .from('tax_masters')
      .select('uuid')
      .eq('uuid', id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Tax not found' }, { status: 404 })
    }

    // Check for duplicate code on other taxes
    if (tax_code) {
      const { data: codeExists } = await supabaseAdmin
        .from('tax_masters')
        .select('uuid')
        .eq('tax_code', tax_code)
        .neq('uuid', id)
        .eq('is_deleted', false)
        .single()

      if (codeExists) {
        return NextResponse.json(
          { error: 'Tax code already exists', details: { tax_code: 'Already in use' } },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabaseAdmin
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

    if (error) throw error

    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('Error updating tax:', error)
    return NextResponse.json({ error: 'Failed to update tax' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Check tax exists
    const { data: existing } = await supabaseAdmin
      .from('tax_masters')
      .select('uuid')
      .eq('uuid', id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Tax not found' }, { status: 404 })
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('tax_masters')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('uuid', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tax:', error)
    return NextResponse.json({ error: 'Failed to delete tax' }, { status: 500 })
  }
}
