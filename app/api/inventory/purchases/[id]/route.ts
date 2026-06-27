import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [poRes, itemsRes] = await Promise.all([
    supabaseAdmin
      .from('purchase_orders')
      .select('*, suppliers(id, supplier_name, contact_person, mobile, email)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('purchase_items')
      .select('*, inventory_products(id, sku, name, unit)')
      .eq('po_id', id),
  ])

  if (poRes.error) return NextResponse.json({ error: poRes.error.message }, { status: 404 })
  return NextResponse.json({ ...poRes.data, items: itemsRes.data ?? [] })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { status, notes, expected_delivery_date } = body

  const { data, error } = await supabaseAdmin
    .from('purchase_orders')
    .update({ status, notes, expected_delivery_date })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
