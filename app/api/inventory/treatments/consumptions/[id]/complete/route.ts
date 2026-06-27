import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/inventory/treatments/consumptions/[id]/complete
 * Marks treatment as completed, reduces stock, creates ledger entries
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabaseAdmin.rpc('complete_treatment_consumption', {
    p_consumption_id: id,
    p_completed_by: null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = await supabaseAdmin
    .from('treatment_consumptions')
    .select('*, treatment_recipes(treatment_name), treatment_consumption_items(*, inventory_products(name, unit))')
    .eq('id', id)
    .single()

  return NextResponse.json({ success: true, consumption: data })
}
