import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('[REQUEST] New save request')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let requestBody: any = {}
  try {
    requestBody = await req.json()
    console.log('[REQUEST] Body received:', JSON.stringify(requestBody, null, 2))
  } catch (parseError) {
    console.error('[REQUEST] Parse error:', parseError)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validation
  console.log('[VALIDATION] Checking required fields...')
  const validations = {
    patient_uhid: !!requestBody.patient_uhid,
    doctor_name: !!requestBody.doctor_name,
    patient_name: !!requestBody.patient_name,
  }
  console.log('[VALIDATION] Results:', validations)

  if (!requestBody.doctor_name) {
    console.log('[VALIDATION] FAILED - doctor_name missing')
    return NextResponse.json({ error: 'Doctor name required' }, { status: 400 })
  }

  // Build payload
  console.log('[PAYLOAD] Building insert object...')
  const insertPayload = {
    patient_id: requestBody.patient_uhid,
    booking_id: requestBody.booking_uuid,
    doctor_name: requestBody.doctor_name,
    patient_uhid: requestBody.patient_uhid,
    patient_name: requestBody.patient_name,
    age: requestBody.age,
    sex: requestBody.sex,
    doa_date: requestBody.doa_date,
    doa_time: requestBody.doa_time,
    dod_date: requestBody.dod_date,
    dod_time: requestBody.dod_time,
    nationality: requestBody.nationality,
    address: requestBody.address,
    diagnosis: requestBody.diagnosis,
    complaints: requestBody.complaints || [],
    history_present_complaints: requestBody.history_present_complaints,
    history_days: requestBody.history_days,
    past_history_medical: requestBody.past_history_medical,
    past_history_surgical: requestBody.past_history_surgical,
    past_history_details: requestBody.past_history_details,
    medication_administered: requestBody.medication_administered,
    day_of_therapy: requestBody.day_of_therapy,
    pradhan_vedna: requestBody.pradhan_vedna || [],
    vitals_bp: requestBody.vitals_bp,
    vitals_hr: requestBody.vitals_hr,
    vitals_nadi: requestBody.vitals_nadi,
    oe_mala: requestBody.oe_mala,
    oe_mutra: requestBody.oe_mutra,
    oe_jihwa: requestBody.oe_jihwa,
    oe_shuda: requestBody.oe_shuda,
    oe_nidra: requestBody.oe_nidra,
    therapies: requestBody.therapies || [],
    investigations: requestBody.investigations,
    findings_discharge: requestBody.findings_discharge,
    condition_discharge: requestBody.condition_discharge,
    advice_discharge: requestBody.advice_discharge,
    medicine_discharge: requestBody.medicine_discharge,
    medicines: requestBody.medicines || [],
    cautions: requestBody.cautions,
    pathya: requestBody.pathya,
    apathya: requestBody.apathya,
  }

  console.log('[PAYLOAD] Object keys:', Object.keys(insertPayload).length)
  console.log('[PAYLOAD] Sample fields:', {
    patient_uhid: insertPayload.patient_uhid,
    doctor_name: insertPayload.doctor_name,
    complaints_type: typeof insertPayload.complaints,
    complaints_length: insertPayload.complaints?.length,
  })

  // Create Supabase client
  console.log('[INSERT] Creating Supabase client...')
  const supabase = createClient(supabaseUrl!, serviceRoleKey!)

  try {
    console.log('[INSERT] Calling supabase.from("discharge_summaries").insert()...')
    const { data, error, status, statusText, count } = await supabase
      .from('discharge_summaries')
      .insert([insertPayload])
      .select()
      .single()

    console.log('[SUPABASE RESPONSE]', {
      status,
      statusText,
      count,
      data_exists: !!data,
      error_exists: !!error,
    })

    if (error) {
      console.error('[SUPABASE ERROR]', {
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

    if (data) {
      console.log('[INSERT SUCCESS]', { id: data.id, patient_uhid: data.patient_uhid })

      console.log('[HTTP RESPONSE] Returning 201 with success')
      return NextResponse.json({ success: true, id: data.id }, { status: 201 })
    }

    console.log('[INSERT] No error but no data returned')
    return NextResponse.json({ error: 'No data returned' }, { status: 500 })
  } catch (error) {
    console.error('[EXCEPTION]', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


