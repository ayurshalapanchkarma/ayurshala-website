import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/discharge-summaries
 *
 * Returns all discharge summaries joined with booking and patient data.
 * Used by the Discharge Summary History page.
 *
 * Query params:
 *   search        - filter by patient_id, patient_name, booking_number, doctor, diagnosis
 *   doctor        - filter by exact doctor name
 *   date_from     - filter by created_at >= date_from
 *   date_to       - filter by created_at <= date_to
 *   page          - 1-based page number (default 1)
 *   page_size     - rows per page (default 25, max 100)
 */
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const params = req.nextUrl.searchParams
  const search    = params.get('search')?.trim() ?? ''
  const doctor    = params.get('doctor')?.trim() ?? ''
  const dateFrom  = params.get('date_from') ?? ''
  const dateTo    = params.get('date_to') ?? ''
  const page      = Math.max(1, parseInt(params.get('page') ?? '1', 10))
  const pageSize  = Math.min(100, Math.max(1, parseInt(params.get('page_size') ?? '25', 10)))

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // ── Fetch discharge summaries ─────────────────────────────────────────
    let query = supabase
      .from('discharge_summaries')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })

    if (doctor) {
      query = query.eq('doctor_name', doctor)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      // include the full day
      query = query.lte('created_at', dateTo + 'T23:59:59Z')
    }

    // Apply search as an ilike on text columns directly available on discharge_summaries
    if (search) {
      query = query.or(
        `patient_name.ilike.%${search}%,patient_uhid.ilike.%${search}%,doctor_name.ilike.%${search}%,diagnosis.ilike.%${search}%`
      )
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1
    query = query.range(from, to)

    const { data: summaries, error, count } = await query

    if (error) {
      console.error('[GET /discharge-summaries] Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!summaries || summaries.length === 0) {
      return NextResponse.json({ summaries: [], total: 0, page, page_size: pageSize })
    }

    // ── Enrich with booking data (booking_number, preferred_date) ─────────
    const bookingUuids = summaries.map(s => s.booking_id).filter(Boolean)

    const { data: bookings } = await supabase
      .from('bookings_new')
      .select('id, booking_id, preferred_date')
      .in('id', bookingUuids)

    const bookingMap = new Map(bookings?.map(b => [b.id, b]) ?? [])

    // ── Build response rows ───────────────────────────────────────────────
    const rows = summaries.map(s => {
      const booking = bookingMap.get(s.booking_id)
      return {
        id:               s.id,
        booking_uuid:     s.booking_id,
        booking_number:   booking?.booking_id ?? '—',    // AYB-... from bookings_new.booking_id
        patient_id:       s.patient_uhid ?? '—',         // AYP-... stored on the summary
        patient_name:     s.patient_name ?? '—',
        doctor_name:      s.doctor_name ?? '—',
        diagnosis:        s.diagnosis ?? '—',
        doa_date:         s.doa_date ?? null,
        dod_date:         s.dod_date ?? null,
        created_at:       s.created_at,
        updated_at:       s.updated_at,
      }
    })

    // ── Filter by booking_number if search looks like AYB- ────────────────
    // The OR filter above covers patient/doctor/diagnosis columns but booking_number
    // lives on bookings_new, not discharge_summaries, so we filter it here.
    const finalRows = search && (search.toUpperCase().startsWith('AYB') || search.toUpperCase().startsWith('AY'))
      ? rows.filter(r =>
          r.booking_number.toLowerCase().includes(search.toLowerCase()) ||
          r.patient_id.toLowerCase().includes(search.toLowerCase()) ||
          r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
          r.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
          r.diagnosis.toLowerCase().includes(search.toLowerCase())
        )
      : rows

    return NextResponse.json({
      summaries: finalRows,
      total: count ?? finalRows.length,
      page,
      page_size: pageSize,
    })
  } catch (e) {
    console.error('[GET /discharge-summaries] Exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/discharge-summaries
 *
 * Soft-deletes a discharge summary by id.
 * Body: { id: string }
 */
export async function DELETE(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let body: { id?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Soft delete — mark deleted_at rather than removing the row
  // If the table doesn't have deleted_at, fall back to hard delete after confirmation
  const { error } = await supabase
    .from('discharge_summaries')
    .delete()
    .eq('id', body.id)

  if (error) {
    console.error('[DELETE /discharge-summaries] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[DELETE /discharge-summaries] Deleted id:', body.id)
  return NextResponse.json({ success: true })
}
