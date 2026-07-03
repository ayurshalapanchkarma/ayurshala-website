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

  // CRITICAL: Validate booking_id before any Supabase queries
  console.log('[VALIDATION] Checking booking_id...')
  const bookingId = requestBody.booking_uuid
  
  if (
    !bookingId ||
    bookingId === 'null' ||
    bookingId === 'undefined' ||
    bookingId === '' ||
    (typeof bookingId === 'string' && bookingId.trim() === '')
  ) {
    console.log('[VALIDATION] FAILED - booking_id missing or invalid:', bookingId)
    return NextResponse.json(
      { 
        error: 'Missing appointment. Please open the discharge summary from an appointment.',
        code: 'MISSING_BOOKING_ID'
      }, 
      { status: 400 }
    )
  }

  // Validation
  console.log('[VALIDATION] Checking required fields...')
  const validations = {
    booking_id: !!bookingId,
    patient_uhid: !!requestBody.patient_uhid,
    doctor_name: !!requestBody.doctor_name,
    patient_name: !!requestBody.patient_name,
  }
  console.log('[VALIDATION] Results:', validations)

  if (!requestBody.doctor_name) {
    console.log('[VALIDATION] FAILED - doctor_name missing')
    return NextResponse.json({ error: 'Doctor name required' }, { status: 400 })
  }

  // Build payload - use validated bookingId
  console.log('[PAYLOAD] Building insert object...')
  const insertPayload = {
    patient_id: requestBody.patient_uhid,
    booking_id: bookingId,
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
  console.log('[CLIENT] Creating Supabase client...')
  const supabase = createClient(supabaseUrl!, serviceRoleKey!)

  try {
    // EXPLICIT UPSERT LOGIC: Check if record exists first
    console.log('[EXPLICIT-UPSERT] Checking if booking_id exists:', insertPayload.booking_id)
    
    const { data: existingRecord, error: checkError } = await supabase
      .from('discharge_summaries')
      .select('id')
      .eq('booking_id', insertPayload.booking_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('[EXPLICIT-UPSERT] Error checking for existing record:', checkError)
      return NextResponse.json(
        { error: `Failed to check existing record: ${checkError.message}` },
        { status: 500 }
      )
    }

    let result
    let operation = 'INSERT'

    if (existingRecord?.id) {
      // Record exists → UPDATE
      operation = 'UPDATE'
      console.log('[EXPLICIT-UPSERT] Record exists with id:', existingRecord.id)
      console.log('[EXPLICIT-UPSERT] Performing UPDATE...')
      
      // CRITICAL: Explicitly set updated_at to NOW() for UPDATE operations
      // Supabase doesn't auto-update this, we must do it explicitly
      const updatePayload = {
        ...insertPayload,
        updated_at: new Date().toISOString() // Ensure updated_at is set to current time
      }
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .update(updatePayload)
        .eq('id', existingRecord.id)
        .select()
        .single()

      if (error) {
        console.error('[EXPLICIT-UPSERT] UPDATE error:', error)
        return NextResponse.json(
          { error: `UPDATE failed: ${error.message}` },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Record does not exist → INSERT
      console.log('[EXPLICIT-UPSERT] Record does not exist')
      console.log('[EXPLICIT-UPSERT] Performing INSERT...')
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .insert([insertPayload])
        .select()
        .single()

      if (error) {
        console.error('[EXPLICIT-UPSERT] INSERT error:', error)
        return NextResponse.json(
          { error: `INSERT failed: ${error.message}` },
          { status: 500 }
        )
      }
      result = data
    }

    console.log(`[EXPLICIT-UPSERT] ${operation} SUCCESS`, {
      id: result?.id,
      booking_id: result?.booking_id,
      patient_uhid: result?.patient_uhid,
      operation,
    })

    console.log('[HTTP-RESPONSE] Returning 200 with complete record')
    return NextResponse.json({
      success: true,
      id: result?.id,
      data: result,
      operation, // Indicates whether INSERT or UPDATE was performed
    }, { status: 200 })
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


