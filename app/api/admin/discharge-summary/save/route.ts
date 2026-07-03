import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolveBookingContext } from '@/lib/booking-context'

export async function POST(req: NextRequest) {
  const ENVIRONMENT = process.env.VERCEL_ENV || 'local'
  const COMMIT_HASH = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'
  const BUILD_TIME = process.env.VERCEL_BUILD_TIME || new Date().toISOString()

  // ── Startup log — confirms which code is actually running ─────────────────
  console.log('[SAVE] Request received', {
    environment: ENVIRONMENT,
    commit: COMMIT_HASH,
    build: BUILD_TIME,
    timestamp: new Date().toISOString(),
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let requestBody: Record<string, unknown> = {}
  try {
    requestBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── Validate booking_uuid ─────────────────────────────────────────────────
  const rawBookingUuid = requestBody.booking_uuid as string | undefined

  console.log('[SAVE] Received identifier:', {
    booking_uuid: rawBookingUuid,
    type: typeof rawBookingUuid,
  })

  if (!rawBookingUuid || rawBookingUuid.trim() === '') {
    return NextResponse.json(
      {
        success: false,
        code: 'MISSING_BOOKING_UUID',
        message: 'Unable to locate the appointment. Please reopen the discharge summary from the Appointments page.',
      },
      { status: 400 }
    )
  }

  // Hard reject if a booking_number slipped through
  if (rawBookingUuid.startsWith('AYB-') || rawBookingUuid.startsWith('AYP-')) {
    console.error('[SAVE] Received booking_number where UUID is required:', rawBookingUuid)
    return NextResponse.json(
      {
        success: false,
        code: 'INVALID_BOOKING_UUID',
        message: 'Unable to locate the appointment. Please reopen the discharge summary from the Appointments page.',
      },
      { status: 400 }
    )
  }

  // ── Resolve booking context (single source of truth) ─────────────────────
  const resolved = await resolveBookingContext(rawBookingUuid, supabaseUrl, serviceRoleKey, 'SAVE')

  if (!resolved.ok) {
    return NextResponse.json(
      {
        success: false,
        code: resolved.code,
        message: resolved.error,
      },
      { status: resolved.code === 'INVALID_INPUT' ? 400 : 404 }
    )
  }

  const { context } = resolved

  // Log the fully resolved context — every subsequent DB query uses context.booking_uuid
  console.log('[SAVE] Context resolved:', {
    booking_number: context.booking_number,
    booking_uuid: context.booking_uuid,
    patient_id: context.patient_id,
    patient_uuid: context.patient_uuid,
    discharge_summary_id: context.discharge_summary_id,
    environment: ENVIRONMENT,
    commit: COMMIT_HASH,
  })

  // ── Validate required fields ──────────────────────────────────────────────
  if (!requestBody.doctor_name) {
    return NextResponse.json({ success: false, error: 'Doctor name is required' }, { status: 400 })
  }

  // ── Build payload ─────────────────────────────────────────────────────────
  const payload = {
    // Always use the UUID from the resolved context — never the raw input
    patient_id: context.patient_uuid,
    booking_id: context.booking_uuid,
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

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    let result: Record<string, unknown>
    let operation: 'INSERT' | 'UPDATE'

    if (context.discharge_summary_id) {
      // ── UPDATE existing record ──────────────────────────────────────────
      operation = 'UPDATE'
      console.log('[SAVE] Performing UPDATE on discharge_summaries.id =', context.discharge_summary_id)

      const { data, error } = await supabase
        .from('discharge_summaries')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', context.discharge_summary_id)
        .select()
        .single()

      if (error) {
        console.error('[SAVE] UPDATE failed:', error)
        return NextResponse.json(
          {
            success: false,
            code: 'UPDATE_FAILED',
            message: 'Failed to update the discharge summary. Please try again.',
          },
          { status: 500 }
        )
      }
      result = data as Record<string, unknown>
    } else {
      // ── INSERT new record ───────────────────────────────────────────────
      operation = 'INSERT'
      console.log('[SAVE] Performing INSERT into discharge_summaries for booking_uuid =', context.booking_uuid)

      const { data, error } = await supabase
        .from('discharge_summaries')
        .insert([payload])
        .select()
        .single()

      if (error) {
        console.error('[SAVE] INSERT failed:', error)
        return NextResponse.json(
          {
            success: false,
            code: 'INSERT_FAILED',
            message: 'Failed to save the discharge summary. Please try again.',
          },
          { status: 500 }
        )
      }
      result = data as Record<string, unknown>
    }

    console.log('[SAVE] SUCCESS', {
      operation,
      id: result.id,
      booking_id: result.booking_id,
      booking_number: context.booking_number,
    })

    return NextResponse.json(
      {
        success: true,
        operation,
        id: result.id,
        data: result,
        // Return both identifiers so the caller can verify the flow
        booking_uuid: context.booking_uuid,
        booking_number: context.booking_number,
      },
      { status: 200 }
    )
  } catch (e) {
    console.error('[SAVE] Exception:', e)
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
