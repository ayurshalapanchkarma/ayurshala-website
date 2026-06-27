import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('stock_adjustments')
    .select('*, inventory_products(id, sku, name, unit), inventory_batches(id, batch_number)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('approval_status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { product_id, batch_id, adjustment_type, quantity, reason, remarks, photo_urls } = body

  if (!product_id) return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  if (!adjustment_type) return NextResponse.json({ error: 'adjustment_type is required' }, { status: 400 })
  if (!quantity || quantity <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 })
  if (!reason?.trim()) return NextResponse.json({ error: 'reason is required' }, { status: 400 })

  const { data: adjNum } = await supabaseAdmin.rpc('generate_adjustment_number')

  const { data, error } = await supabaseAdmin
    .from('stock_adjustments')
    .insert({
      adjustment_number: adjNum,
      product_id, batch_id: batch_id ?? null,
      adjustment_type, quantity,
      reason: reason.trim(), remarks,
      photo_urls: photo_urls ?? [],
      approval_status: 'PENDING',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
