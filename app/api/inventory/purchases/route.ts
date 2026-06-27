import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const supplier_id = searchParams.get('supplier_id')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('purchase_orders')
    .select('*, suppliers(id, supplier_name, contact_person, mobile)', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (supplier_id) query = query.eq('supplier_id', supplier_id)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { supplier_id, order_date, expected_delivery_date, notes, items } = body

  if (!supplier_id) return NextResponse.json({ error: 'supplier_id is required' }, { status: 400 })
  if (!items?.length) return NextResponse.json({ error: 'items array is required' }, { status: 400 })

  // Generate PO number
  const { data: poNum } = await supabaseAdmin.rpc('generate_po_number')

  // Calculate totals
  let total_amount = 0, total_gst = 0
  const itemsWithCalc = items.map((item: {
    product_id: string; quantity: number; unit_price: number; gst_percent?: number
  }) => {
    const base = item.quantity * item.unit_price
    const gst = base * ((item.gst_percent ?? 0) / 100)
    total_amount += base
    total_gst += gst
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      gst_percent: item.gst_percent ?? 0,
      gst_amount: parseFloat(gst.toFixed(2)),
      total_amount: parseFloat((base + gst).toFixed(2)),
      received_quantity: 0,
    }
  })

  const { data: po, error: poErr } = await supabaseAdmin
    .from('purchase_orders')
    .insert({
      po_number: poNum,
      supplier_id,
      order_date: order_date ?? new Date().toISOString().slice(0, 10),
      expected_delivery_date,
      status: 'DRAFT',
      total_amount: parseFloat(total_amount.toFixed(2)),
      total_gst: parseFloat(total_gst.toFixed(2)),
      grand_total: parseFloat((total_amount + total_gst).toFixed(2)),
      notes,
    })
    .select()
    .single()

  if (poErr) return NextResponse.json({ error: poErr.message }, { status: 500 })

  const { error: itemsErr } = await supabaseAdmin
    .from('purchase_items')
    .insert(itemsWithCalc.map((i: Record<string, unknown>) => ({ ...i, po_id: po.id })))

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

  return NextResponse.json({ ...po, items: itemsWithCalc }, { status: 201 })
}
