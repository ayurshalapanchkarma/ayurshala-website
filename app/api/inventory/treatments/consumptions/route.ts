import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/inventory/treatments/consumptions
 * Creates a treatment consumption (pre-allocates FIFO batches)
 * Body: { treatment_id, appointment_id?, patient_name? }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('treatment_consumptions')
    .select('*, treatment_recipes(id, treatment_name, treatment_code)', { count: 'exact' })
    .eq('is_deleted', false)
    .order('consumption_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { treatment_id, appointment_id, patient_name } = body

  if (!treatment_id) return NextResponse.json({ error: 'treatment_id is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.rpc('create_treatment_consumption', {
    p_treatment_id: treatment_id,
    p_appointment_id: appointment_id ?? null,
    p_patient_name: patient_name ?? null,
    p_created_by: null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ consumption_id: data }, { status: 201 })
}
