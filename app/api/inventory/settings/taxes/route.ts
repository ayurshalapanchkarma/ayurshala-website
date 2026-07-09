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
      .from('inv_tax_master')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`tax_name.ilike.%${search}%,hsn_code.ilike.%${search}%`)
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
    console.log('Incoming payload:', body)
    
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

    // Check for duplicate name
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('inv_tax_master')
      .select('uuid')
      .eq('tax_name', tax_name.trim())
      .eq('is_active', true)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Database check failed: ${checkError.message}`)
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Tax name already exists', details: { tax_name: `Tax "${tax_name.trim()}" already exists` } },
        { status: 409 }
      )
    }

    // Insert into database
    const insertData = {
      tax_name: tax_name.trim(),
      hsn_code: hsn_code?.trim() || null,
      tax_percentage: percentage,
      description: description?.trim() || null,
      is_active: true,
    }
    
    console.log('Insert payload:', insertData)

    const { data, error: insertError } = await supabaseAdmin
      .from('inv_tax_master')
      .insert(insertData)
      .select()

    console.log('Supabase response:', { data, error: insertError })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      
      // More specific error messages
      if (insertError.message?.includes('violates unique constraint')) {
        return NextResponse.json(
          { error: 'Tax already exists with this configuration', details: { tax_name: 'Tax name must be unique' } },
          { status: 409 }
        )
      }
      
      if (insertError.message?.includes('NOT NULL constraint')) {
        const match = insertError.message.match(/column "([^"]+)"/)
        const column = match ? match[1] : 'required field'
        return NextResponse.json(
          { error: `${column} is required`, details: { [column]: `${column} is required` } },
          { status: 400 }
        )
      }

      throw insertError
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Tax created but could not retrieve record', details: {} },
        { status: 201 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating tax:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create tax: ${errorMessage}`, details: {} },
      { status: 500 }
    )
  }
}
