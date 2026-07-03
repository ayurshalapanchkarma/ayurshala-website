import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Accept booking_uuid only — this is the UUID from bookings_new.id
  // The old ?bookingId and ?appointmentId params accepted AYB-... strings which
  // caused Postgres UUID type errors. Those params are no longer supported.
  const bookingUuid = req.nextUrl.searchParams.get('booking_uuid')

  if (!bookingUuid) {
    return NextResponse.json(
      {
        error: 'booking_uuid is required',
        code: 'MISSING_BOOKING_UUID',
        message: 'Please reopen the discharge summary from the Appointments page.',
      },
      { status: 400 }
    )
  }

  // Reject if caller accidentally passed a booking_number (AYB-...) instead of a UUID
  if (bookingUuid.startsWith('AYB-') || bookingUuid.startsWith('AYP-')) {
    console.error('[GET] Received booking_number where UUID is required:', bookingUuid)
    return NextResponse.json(
      {
        error: 'Invalid identifier: received a booking reference number where a UUID is required.',
        code: 'INVALID_BOOKING_UUID',
        message: 'Please reopen the discharge summary from the Appointments page.',
      },
      { status: 400 }
    )
  }

  console.log('[GET] Loading discharge summary for booking_uuid:', bookingUuid)

  const supabase = createClient(supabaseUrl!, serviceRoleKey!)

  try {
    // booking_id column in discharge_summaries is type UUID — safe to query with bookingUuid
    const { data, error } = await supabase
      .from('discharge_summaries')
      .select('*')
      .eq('booking_id', bookingUuid)
      .maybeSingle()

    if (error) {
      console.error('[GET] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[GET] Result:', data ? `Found record id=${data.id}` : 'No record found')

    return NextResponse.json({ data: data ?? null }, { status: 200 })
  } catch (e) {
    console.error('[GET] Exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
