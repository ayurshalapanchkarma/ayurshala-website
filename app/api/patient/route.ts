import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)

export async function POST(req: NextRequest) {
  const { email, full_name, phone, google_user_id, avatar_url } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Check existing patient
  const { data: existing } = await supabase.from('patients').select('*').eq('email', email).single()
  if (existing) {
    // Update name/phone if provided and missing
    const updates: any = { updated_at: new Date().toISOString() }
    if (full_name && !existing.full_name) updates.full_name = full_name
    if (phone && !existing.phone) updates.phone = phone
    if (google_user_id && !existing.google_user_id) updates.google_user_id = google_user_id
    if (avatar_url && !existing.avatar_url) updates.avatar_url = avatar_url
    await supabase.from('patients').update(updates).eq('id', existing.id)
    return NextResponse.json({ patient: { ...existing, ...updates } })
  }

  // Create new patient (trigger auto-generates patient_id)
  const { data: newPatient, error } = await supabase.from('patients').insert({
    email, full_name: full_name || '', phone: phone || '',
    google_user_id: google_user_id || null,
    avatar_url: avatar_url || null,
    auth_provider: google_user_id ? 'google' : 'email',
    email_verified: !!google_user_id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ patient: newPatient })
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  const patient_id = req.nextUrl.searchParams.get('patient_id')
  const phone = req.nextUrl.searchParams.get('phone')

  let query = supabase.from('patients').select('*')
  if (email) query = query.eq('email', email)
  else if (patient_id) query = query.eq('patient_id', patient_id)
  else if (phone) query = query.eq('phone', phone)
  else return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const { data } = await query.single()
  return NextResponse.json({ patient: data || null })
}
