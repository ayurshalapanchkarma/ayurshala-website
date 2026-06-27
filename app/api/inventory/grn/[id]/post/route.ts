import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/inventory/grn/[id]/post
 * Posts a GRN: creates inventory batches + stock transactions
 * Body: { items: [{ product_id, batch_number, mfg_date, exp_date, quantity, purchase_price, mrp }] }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { items } = body

  if (!items?.length) return NextResponse.json({ error: 'items array is required' }, { status: 400 })

  // Validate each item
  for (const item of items) {
    if (!item.product_id) return NextResponse.json({ error: 'product_id required in each item' }, { status: 400 })
    if (!item.batch_number) return NextResponse.json({ error: 'batch_number required in each item' }, { status: 400 })
    if (!item.quantity || item.quantity <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 })
    if (item.purchase_price === undefined) return NextResponse.json({ error: 'purchase_price required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.rpc('post_grn', {
    p_grn_id: id,
    p_items: JSON.stringify(items),
    p_created_by: null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: 'GRN posted. Batches and stock transactions created.' })
}
