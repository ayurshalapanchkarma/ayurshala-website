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
      .from('tax_masters')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`tax_name.ilike.%${search}%,tax_code.ilike.%${search}%`)
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
    console.error('Error fetching taxes:', error)
    return NextResponse.json({ error: 'Failed to fetch taxes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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

    // Check for duplicate code if provided
    if (tax_code) {
      const { data: existing } = await supabaseAdmin
        .from('tax_masters')
        .select('uuid')
        .eq('tax_code', tax_code)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Tax code already exists', details: { tax_code: 'Already in use' } },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabaseAdmin.from('tax_masters').insert({
      tax_name: tax_name.trim(),
      tax_code: tax_code?.trim() || null,
      tax_rate: rate,
      tax_type,
      description: description?.trim() || null,
      is_active: true,
      is_deleted: false,
    }).select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error('Error creating tax:', error)
    return NextResponse.json({ error: 'Failed to create tax' }, { status: 500 })
  }
}
