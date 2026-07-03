import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const bookingUuid = req.nextUrl.searchParams.get('booking_uuid')

  if (!bookingUuid) {
    return NextResponse.json({ error: 'booking_uuid required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('discharge_summaries')
      .select('id')
      .eq('booking_id', bookingUuid)
      .maybeSingle()

    if (error) {
      console.error('[CHECK] Error:', error)
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: !!data,
      id: data?.id || undefined,
    })
  } catch (error) {
    console.error('[CHECK] Exception:', error)
    return NextResponse.json({ exists: false })
  }
}
