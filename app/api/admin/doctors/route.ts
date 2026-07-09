import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/doctors
 * Fetch all doctors with all fields
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({ doctors: data || [] })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
  }
}

/**
 * POST /api/admin/doctors
 * Create a new doctor
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('doctors')
      .insert([
        {
          name: body.name,
          email: body.email,
          phone: body.phone,
          qualification: body.qualification || null,
          specialization: body.specialization,
          experience_years: body.experience_years || null,
          status: body.status || 'active',
          photo_url: body.photo_url || null,
          consultation_timings: body.consultation_timings || null,
          availability_days: body.availability_days || null,
          treatments_offered: body.treatments_offered || [],
          bio: body.bio || null,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ doctor: data?.[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating doctor:', error)
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 400 })
  }
}

/**
 * PUT /api/admin/doctors/[id]
 * Update a doctor
 */
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('doctors')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        qualification: body.qualification || null,
        specialization: body.specialization,
        experience_years: body.experience_years || null,
        status: body.status || 'active',
        photo_url: body.photo_url || null,
        consultation_timings: body.consultation_timings || null,
        availability_days: body.availability_days || null,
        treatments_offered: body.treatments_offered || [],
        bio: body.bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json({ doctor: data?.[0] })
  } catch (error) {
    console.error('Error updating doctor:', error)
    return NextResponse.json({ error: 'Failed to update doctor' }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/doctors/[id]
 * Delete a doctor
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting doctor:', error)
    return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 400 })
  }
}
