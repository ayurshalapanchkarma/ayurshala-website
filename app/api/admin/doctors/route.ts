import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, mobile, email')
      .order('name')

    if (error) throw error

    return NextResponse.json({ doctors: data || [] })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ doctors: [] }, { status: 500 })
  }
}
