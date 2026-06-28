import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('[INIT] Save discharge summary request')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[SUPABASE]', {
    url: supabaseUrl?.substring(0, 40) + '...',
    hasKey: !!serviceRoleKey,
    keyLength: serviceRoleKey?.length,
  })

  const supabase = createClient(supabaseUrl!, serviceRoleKey!)

  try {
    const data = await req.json()

    console.log('[QUERY] Preparing insert with:', {
      patient_uhid: data.patient_uhid,
      doctor_name: data.doctor_name,
      booking_uuid: data.booking_uuid,
    })

    // Test table access
    const { count, error: testError } = await supabase
      .from('discharge_summaries')
      .select('*', { count: 'exact', head: true })

    if (testError) {
      console.error('[ERROR] Table access failed:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
      })
      return NextResponse.json(
        {
          error: testError.message,
          code: testError.code,
          details: testError.details,
          hint: testError.hint,
        },
        { status: 500 }
      )
    }

    console.log('[QUERY] Table accessible, current rows:', count)

    // Perform insert
    console.log('[INSERT] Starting insert operation')
    const { data: saved, error } = await supabase
      .from('discharge_summaries')
      .insert([
        {
          patient_id: data.patient_uhid,
          booking_id: data.booking_uuid,
          doctor_name: data.doctor_name,
          patient_uhid: data.patient_uhid,
          patient_name: data.patient_name,
          age: data.age,
          sex: data.sex,
          doa_date: data.doa_date,
          doa_time: data.doa_time,
          dod_date: data.dod_date,
          dod_time: data.dod_time,
          nationality: data.nationality,
          address: data.address,
          diagnosis: data.diagnosis,
          complaints: data.complaints || [],
          history_present_complaints: data.history_present_complaints,
          history_days: data.history_days,
          past_history_medical: data.past_history_medical,
          past_history_surgical: data.past_history_surgical,
          past_history_details: data.past_history_details,
          medication_administered: data.medication_administered,
          day_of_therapy: data.day_of_therapy,
          pradhan_vedna: data.pradhan_vedna || [],
          vitals_bp: data.vitals_bp,
          vitals_hr: data.vitals_hr,
          vitals_nadi: data.vitals_nadi,
          oe_mala: data.oe_mala,
          oe_mutra: data.oe_mutra,
          oe_jihwa: data.oe_jihwa,
          oe_shuda: data.oe_shuda,
          oe_nidra: data.oe_nidra,
          therapies: data.therapies || [],
          investigations: data.investigations,
          findings_discharge: data.findings_discharge,
          condition_discharge: data.condition_discharge,
          advice_discharge: data.advice_discharge,
          medicine_discharge: data.medicine_discharge,
          medicines: data.medicines || [],
          cautions: data.cautions,
          pathya: data.pathya,
          apathya: data.apathya,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[ERROR] Insert failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      )
    }

    console.log('[SUCCESS] Insert completed:', { id: saved.id })
    return NextResponse.json({ success: true, id: saved.id }, { status: 201 })
  } catch (error) {
    console.error('[ERROR] Exception:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


