import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/inventory/adjustments/[id]/approve
 * Approves an adjustment: creates stock transaction, reduces batch stock
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabaseAdmin.rpc('approve_adjustment', {
    p_adjustment_id: id,
    p_approved_by: null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = await supabaseAdmin
    .from('stock_adjustments')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json({ success: true, adjustment: data })
}
