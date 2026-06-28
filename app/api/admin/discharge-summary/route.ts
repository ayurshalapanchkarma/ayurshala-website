import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const appointmentId = req.nextUrl.searchParams.get('appointmentId')
  const bookingId = req.nextUrl.searchParams.get('bookingId')

  if (!appointmentId && !bookingId) {
    return NextResponse.json({ error: 'appointmentId or bookingId required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!)

  try {
    let query = supabase.from('discharge_summaries').select('*')

    if (appointmentId) {
      query = query.eq('booking_id', appointmentId)
    } else if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      console.error('[GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ data: null }, { status: 200 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('[GET] Exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
