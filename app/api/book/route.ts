import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)
const resend = new Resend(process.env.RESEND_API_KEY)

function sanitize(s: string) {
  return s.replace(/<[^>]*>/g, '').replace(/[<>'"`;]/g, '').trim().slice(0, 1000)
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const { data } = await supabase.from('settings').select('setting_value').eq('setting_key', key).single()
  return data?.setting_value ?? fallback
}

async function auditLog(booking_uuid: string, patient_uuid: string, action: string, old_value: any, new_value: any) {
  try { await supabase.from('appointment_audit').insert({ booking_uuid, patient_uuid, action, old_value, new_value }) } catch {}
}

function convertTo24(slot: string) {
  const [t, period] = slot.split(' ')
  let [h, m] = t.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  // ── CREATE ORDER ─────────────────────────────────────────────────────────────
  if (action === 'create-order') {
    const { patient_uuid, patient_id, treatments, preferred_date, preferred_time, concern, booking_type, payment_method } = body

    if (!patient_uuid || !treatments?.length || !preferred_date || !preferred_time || !booking_type)
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

    if (new Date(preferred_date).getUTCDay() === 5)
      return NextResponse.json({ error: 'Clinic is closed on Fridays. Please choose another day.' }, { status: 400 })

    if (!['consultation', 'therapy', 'consultation_and_therapy'].includes(booking_type))
      return NextResponse.json({ error: 'Invalid booking type.' }, { status: 400 })

    const sanitizedConcern = concern ? sanitize(concern) : ''

    const consultationFee = parseInt(await getSetting('consultation_fee', '500'))
    const therapyAdvanceFee = parseInt(await getSetting('therapy_advance_fee', '500'))
    const isCod           = payment_method === 'CASH_ON_ARRIVAL'
    
    // Calculate amount: consultation 500 + therapy 500 if both selected
    // Special handling for TEST therapy (₹1)
    const isTestOnly = treatments.length === 1 && treatments[0].includes('TEST')
    let amount = 0
    if (isTestOnly) {
      amount = 1
    } else if (booking_type === 'consultation') {
      amount = consultationFee
    } else if (booking_type === 'therapy') {
      amount = therapyAdvanceFee
    } else if (booking_type === 'consultation_and_therapy') {
      amount = consultationFee + therapyAdvanceFee
    }

    // Get clinic
    const { data: clinic } = await supabase.from('clinics').select('id').eq('is_active', true).single()

    // Duplicate check
    const { data: existing } = await supabase.from('bookings_new')
      .select('id').eq('patient_uuid', patient_uuid)
      .eq('preferred_date', preferred_date).eq('preferred_time', preferred_time)
      .eq('is_deleted', false).neq('status', 'CANCELLED').maybeSingle()
    if (existing) return NextResponse.json({ error: 'You already have a booking for this slot.' }, { status: 409 })

    // Slot capacity check
    const maxCap = parseInt(await getSetting('slot_max_capacity', '5'))
    const { count: slotCount } = await supabase.from('bookings_new')
      .select('id', { count: 'exact', head: true })
      .eq('preferred_date', preferred_date).eq('preferred_time', preferred_time)
      .eq('is_deleted', false).neq('status', 'CANCELLED')
    if ((slotCount ?? 0) >= maxCap)
      return NextResponse.json({ error: 'This time slot is fully booked. Please choose another.' }, { status: 409 })

    const bookingStatus = isCod ? 'PENDING_CONFIRMATION' : 'PAYMENT_PENDING'

    const { data: booking, error: bookingErr } = await supabase.from('bookings_new').insert({
      clinic_id: clinic?.id ?? null,
      patient_uuid, booking_type,
      preferred_date, preferred_time,
      concern: sanitizedConcern,
      status: bookingStatus,
      payment_status: 'PENDING',
      payment_method: isCod ? 'CASH_ON_ARRIVAL' : 'ONLINE',
    }).select().single()
    if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 })

    // Insert treatments (resolve UUIDs from treatments table)
    const { data: treatmentRows } = await supabase.from('treatments')
      .select('id,name').in('name', treatments)
    await supabase.from('booking_treatments_v2').insert(
      treatments.map((t: string) => ({
        booking_uuid: booking.id,
        treatment_name: t,
        treatment_uuid: treatmentRows?.find((r: any) => r.name === t)?.id ?? null,
      }))
    )

    // Payment record
    await supabase.from('payments').insert({
      booking_uuid: booking.id, patient_uuid,
      cashfree_order_id: booking.booking_id,
      amount, status: 'PENDING',
      payment_method: isCod ? 'CASH_ON_ARRIVAL' : 'ONLINE',
    })

    await auditLog(booking.id, patient_uuid, 'BOOKING_CREATED', null, { booking_type, preferred_date, preferred_time, payment_method })

    // Send "Booking Received" emails to patient and clinic
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', patient_uuid).single()
    const treatmentList = treatments.join(', ') || '—'
    const formattedDate = new Date(preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    
    const bookingReceivedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)"><tr><td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1008">Booking Received</h1><p style="margin:8px 0 0;font-size:13px;color:#a8a29e">We're processing your appointment</p></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date & Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${preferred_time}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Status</span><br><span style="font-size:15px;color:#f59e0b;font-weight:600">${isCod ? 'Pending Confirmation' : 'Awaiting Payment'}</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">${isCod ? 'Our team will call to confirm your appointment.' : 'Complete payment to confirm your appointment.'}</p></td></tr></table></td></tr></table></body></html>`
    
    const emails = [resend.emails.send({ from, to: 'ayurshalapanchkarma@gmail.com', subject: `New Booking Received — ${booking.booking_id} — ${patientData.full_name}`, html: bookingReceivedHtml })]
    if (patientData.email) emails.push(resend.emails.send({ from, to: patientData.email, subject: `Booking Received — ${booking.booking_id}`, html: bookingReceivedHtml }))
    await Promise.all(emails)

    if (isCod) return NextResponse.json({ bookingId: booking.booking_id })

    // Online — Cashfree
    const cashfree = new Cashfree(CFEnvironment.PRODUCTION, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY)
    const cashfreeOrder = await cashfree.PGCreateOrder({
      order_id: booking.booking_id,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: patientData.patient_id,
        customer_name: patientData.full_name || 'Patient',
        customer_email: patientData.email,
        customer_phone: (patientData.phone || '9999999999').replace(/\D/g, '').slice(-10),
      },
      order_meta: { return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/book/verify?order_id={order_id}` },
      order_note: `${booking_type} | ${treatments.join(', ')} | ${preferred_date} ${preferred_time}`,
    })

    return NextResponse.json({ bookingId: booking.booking_id, paymentSessionId: cashfreeOrder.data.payment_session_id })
  }

  // ── CONFIRM BOOKING ───────────────────────────────────────────────────────────
  if (action === 'confirm-booking') {
    const { booking_id, cashfree_order_id, transaction_id, payment_method } = body

    const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const isCod = payment_method === 'CASH_ON_ARRIVAL'
    const paymentStatusVal = isCod ? 'PENDING' : 'SUCCESS'
    const bookingStatusVal = isCod ? 'PENDING_CONFIRMATION' : 'CONFIRMED'

    await supabase.from('bookings_new').update({ status: bookingStatusVal, payment_status: paymentStatusVal }).eq('booking_id', booking_id)
    await supabase.from('payments').update({
      status: paymentStatusVal,
      transaction_id: transaction_id || '',
      paid_at: isCod ? null : new Date().toISOString(),
    }).eq('cashfree_order_id', cashfree_order_id)

    if (!isCod) {
      await supabase.from('invoices').insert({ booking_uuid: booking.id, amount: booking.booking_type === 'consultation' ? 500 : 1000 })
    }

    await auditLog(booking.id, booking.patient_uuid, isCod ? 'COD_BOOKING_RECEIVED' : 'PAYMENT_SUCCESS', null, { bookingStatusVal, paymentStatusVal })

    const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
    const amountLabel = isCod ? `₹${booking.booking_type === 'consultation' ? 500 : 1000} — Cash on Arrival` : `₹${booking.booking_type === 'consultation' ? 500 : 1000} — Paid Online`
    const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ayurshalapanchakarma.com'

    if (isCod) {
      // Clinic gets email with Confirm + Cancel buttons
      const confirmUrl = `${appUrl}/api/admin/confirm?booking_id=${booking_id}&secret=${process.env.ADMIN_CONFIRM_SECRET ?? 'ayurshala-confirm'}`
      const cancelUrl = `${appUrl}/api/admin/cancel?booking_id=${booking_id}&secret=${process.env.ADMIN_CONFIRM_SECRET ?? 'ayurshala-confirm'}`
      const clinicHtml = buildClinicPendingEmail({ patient, booking, treatmentList, formattedDate, amountLabel, confirmUrl, cancelUrl })
      await resend.emails.send({ from, to: 'ayurshalapanchkarma@gmail.com', subject: `COD Booking — Awaiting Confirmation — ${booking.booking_id}`, html: clinicHtml })
    } else {
      // Online payment — send confirmation email
      sendTelegram(`*Booking Confirmed — Ayurshala*\n\n*${patient.full_name}*\n${patient.patient_id}\n${booking.booking_id}\n${patient.phone || '—'}\n${patient.email}\n${treatmentList}\n${booking.preferred_date} · ${booking.preferred_time}\n${amountLabel}`)
      const emailHtml = buildEmailHtml({ patient, booking, treatmentList, formattedDate, amountLabel, isCod: false })
      const emails = [resend.emails.send({ from, to: 'ayurshalapanchkarma@gmail.com', subject: `Booking Confirmed — ${booking.booking_id}`, html: emailHtml(true) })]
      if (patient.email) emails.push(resend.emails.send({ from, to: patient.email, subject: `Booking Confirmed — ${booking.booking_id}`, html: emailHtml(false) }))
      await Promise.all(emails)
    }

    return NextResponse.json({ success: true })
  }

  // ── PAY FOR EXISTING BOOKING ─────────────────────────────────────────────────
  if (action === 'pay-existing') {
    const { booking_id, patient_uuid } = body

    const { data: booking } = await supabase.from('bookings_new').select('*')
      .eq('booking_id', booking_id).eq('patient_uuid', patient_uuid).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

    const { data: patient } = await supabase.from('patients').select('*').eq('id', patient_uuid).single()
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 })

    const amount = booking.booking_type === 'consultation' ? 500 : 1000
    const cashfree = new Cashfree(CFEnvironment.PRODUCTION, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY)

    const cashfreeOrder = await cashfree.PGCreateOrder({
      order_id: `${booking_id}-PAY`,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: patient.patient_id,
        customer_name: patient.full_name || 'Patient',
        customer_email: patient.email,
        customer_phone: (patient.phone || '9999999999').replace(/\D/g, '').slice(-10),
      },
      order_meta: { return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/book/verify?order_id={order_id}&original_booking_id=${booking_id}` },
      order_note: `Payment for ${booking_id}`,
    })

    return NextResponse.json({ paymentSessionId: cashfreeOrder.data.payment_session_id })
  }

  // ── CANCEL BOOKING ────────────────────────────────────────────────────────────
  if (action === 'cancel-booking') {
    const { booking_id, patient_uuid } = body

    const { data: booking } = await supabase.from('bookings_new').select('*')
      .eq('booking_id', booking_id).eq('patient_uuid', patient_uuid).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled.' }, { status: 400 })
    if (!['CONFIRMED', 'PENDING_CONFIRMATION'].includes(booking.status))
      return NextResponse.json({ error: 'This booking cannot be cancelled.' }, { status: 400 })

    const windowHours = parseInt(await getSetting('cancellation_window_hours', '24'))
    const apptTime = new Date(`${booking.preferred_date}T${convertTo24(booking.preferred_time)}`)
    if ((apptTime.getTime() - Date.now()) / 3600000 < windowHours)
      return NextResponse.json({ error: `Cancellations must be made at least ${windowHours} hours in advance.` }, { status: 400 })

    await supabase.from('bookings_new').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)
    await auditLog(booking.id, patient_uuid, 'BOOKING_CANCELLED', { status: booking.status }, { status: 'CANCELLED' })

    const { data: patient } = await supabase.from('patients').select('full_name,patient_id,email,phone').eq('id', patient_uuid).single()
    const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
    const wasOnline = booking.payment_method === 'ONLINE'
    const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

    sendTelegram(`*Booking Cancelled — Ayurshala*\n\n${patient?.full_name} (${patient?.patient_id})\n${booking_id}\n${treatmentList}\n${booking.preferred_date} · ${booking.preferred_time}\n${wasOnline ? 'ONLINE PAID — Refund required' : 'Cash on Arrival — No dues'}`)

    const clinicHtml = buildCancellationClinicEmail({ patient, booking, treatmentList, formattedDate, wasOnline })
    await resend.emails.send({ from, to: 'ayurshalapanchkarma@gmail.com', subject: `Booking Cancelled — ${booking_id} — ${patient?.full_name}${wasOnline ? ' — REFUND REQUIRED' : ''}`, html: clinicHtml })

    return NextResponse.json({ success: true })
  }

  // ── RESCHEDULE BOOKING ────────────────────────────────────────────────────────
  if (action === 'reschedule-booking') {
    const { booking_id, patient_uuid, new_date, new_time } = body

    if (!new_date || !new_time) return NextResponse.json({ error: 'New date and time required.' }, { status: 400 })
    if (new Date(new_date).getUTCDay() === 5) return NextResponse.json({ error: 'Clinic is closed on Fridays. Please choose another day.' }, { status: 400 })

    const { data: booking } = await supabase.from('bookings_new').select('*')
      .eq('booking_id', booking_id).eq('patient_uuid', patient_uuid).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

    if (!['CONFIRMED', 'PENDING_CONFIRMATION'].includes(booking.status))
      return NextResponse.json({ error: 'This booking cannot be rescheduled.' }, { status: 400 })

    const windowHours = parseInt(await getSetting('cancellation_window_hours', '24'))
    const apptTime = new Date(`${booking.preferred_date}T${convertTo24(booking.preferred_time)}`)
    if ((apptTime.getTime() - Date.now()) / 3600000 < windowHours)
      return NextResponse.json({ error: `Reschedules must be made at least ${windowHours} hours in advance.` }, { status: 400 })

    const { data: slotConflict } = await supabase.from('bookings_new')
      .select('id').eq('patient_uuid', patient_uuid)
      .eq('preferred_date', new_date).eq('preferred_time', new_time)
      .eq('is_deleted', false).neq('status', 'CANCELLED').maybeSingle()
    if (slotConflict) return NextResponse.json({ error: 'You already have a booking at that time.' }, { status: 409 })

    // Slot capacity check for new slot
    const maxCap = parseInt(await getSetting('slot_max_capacity', '5'))
    const { count: slotCount } = await supabase.from('bookings_new')
      .select('id', { count: 'exact', head: true })
      .eq('preferred_date', new_date).eq('preferred_time', new_time)
      .eq('is_deleted', false).neq('status', 'CANCELLED')
    if ((slotCount ?? 0) >= maxCap)
      return NextResponse.json({ error: 'That time slot is fully booked.' }, { status: 409 })

    await supabase.from('bookings_new').update({
      preferred_date: new_date, preferred_time: new_time,
      old_date: booking.preferred_date, old_time: booking.preferred_time,
      new_date, new_time,
      is_rescheduled: true, rescheduled_at: new Date().toISOString(),
      status: 'PENDING_CONFIRMATION',
      updated_at: new Date().toISOString(),
    }).eq('booking_id', booking_id)

    await auditLog(booking.id, patient_uuid, 'BOOKING_RESCHEDULED',
      { preferred_date: booking.preferred_date, preferred_time: booking.preferred_time },
      { preferred_date: new_date, preferred_time: new_time })

    const { data: rPatient } = await supabase.from('patients').select('full_name,patient_id,email,phone').eq('id', patient_uuid).single()
    const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ayurshalapanchakarma.com'
    const confirmUrl = `${appUrl}/api/admin/confirm-reschedule?booking_id=${booking_id}&secret=${process.env.ADMIN_CONFIRM_SECRET ?? 'ayurshala-confirm'}`
    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const oldDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })
    const newDateFmt = new Date(new_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

    sendTelegram(`🔄 *Reschedule Request — Ayurshala*\n\n👤 ${rPatient?.full_name} (${rPatient?.patient_id})\n📋 ${booking_id}\n💆 ${treatmentList}\n📅 Old: ${booking.preferred_date} · ${booking.preferred_time}\n📅 New: ${new_date} · ${new_time}\n\n✅ Confirm: ${confirmUrl}`)

    await resend.emails.send({
      from, to: 'ayurshalapanchkarma@gmail.com',
      subject: `🔄 Reschedule Request — ${booking_id} — ${rPatient?.full_name}`,
      html: buildRescheduleRequestEmail({ patient: rPatient, booking, treatmentList, oldDate, newDateFmt, new_time, confirmUrl }),
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

function sendTelegram(text: string) {
  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
  }).catch(console.error)
}

function buildCancellationClinicEmail({ patient, booking, treatmentList, formattedDate, wasOnline }: any) {
  const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
  const logoIcon = 'https://ayurshala-website.vercel.app/ayurshala.png'
  const refundNote = wasOnline
    ? `<div style="margin-top:20px;padding:16px 20px;background:linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.04));border-radius:12px;border:1px solid rgba(239,68,68,0.25);backdrop-filter:blur(10px)"><p style="margin:0;font-size:13px;color:#dc2626;font-weight:600">⚠️ Refund Required</p><p style="margin:6px 0 0;font-size:12px;color:#7f1d1d">Amount: ₹${booking.booking_type === 'consultation' ? 500 : 1000}\nContact: ${patient?.phone || '—'} · ${patient?.email || '—'}</p></div>`
    : `<p style="text-align:center;font-size:12px;color:#6b7280;margin-top:20px">💵 Cash on Arrival — No refund needed.</p>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}</style></head><body style="background:linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0);font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;padding:20px"><table width="100%" cellpadding="0" cellspacing="0" style="background:transparent"><tr><td align="center" style="padding:20px 0"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%);border:1px solid rgba(255,255,255,0.85);box-shadow:0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1);backdrop-filter:blur(40px)"><tr><td style="background:linear-gradient(135deg,rgba(232,98,26,0.08) 0%,rgba(245,166,35,0.06) 100%);padding:40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="100" style="height:auto;display:block;margin:0 auto 16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/><h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#1a1008;letter-spacing:0.5px">❌ Booking Cancelled</h1></td></tr><tr><td style="padding:40px"><div style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;backdrop-filter:blur(10px)"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient</span><br><span style="font-size:16px;color:#1a1008;font-weight:600">${patient?.full_name}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Phone</span><br><span style="font-size:15px;color:#78716c">${patient?.phone || '—'}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 16px"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Cancelled Date</span><br><span style="font-size:15px;color:#78716c;text-decoration:line-through">${formattedDate} · ${booking.preferred_time}</span></td></tr></table></div>${refundNote}</td></tr><tr><td style="padding:24px 40px;text-align:center;background:linear-gradient(135deg,rgba(255,248,240,0.4),rgba(245,166,35,0.04));border-top:1px solid rgba(232,98,26,0.08)"><img src="${logoIcon}" alt="" width="28" style="height:auto;display:block;margin:0 auto 8px;opacity:0.6"/><p style="margin:0 0 4px;font-size:11px;color:#8b7c73;letter-spacing:0.3px">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:10px;color:#a8a29e">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}

function buildRescheduleRequestEmail({ patient, booking, treatmentList, oldDate, newDateFmt, new_time, confirmUrl }: any) {
  const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
  const logoIcon = 'https://ayurshala-website.vercel.app/ayurshala.png'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}</style></head><body style="background:linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0);font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;padding:20px"><table width="100%" cellpadding="0" cellspacing="0" style="background:transparent"><tr><td align="center" style="padding:20px 0"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%);border:1px solid rgba(255,255,255,0.85);box-shadow:0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1);backdrop-filter:blur(40px)"><tr><td style="background:linear-gradient(135deg,rgba(232,98,26,0.08) 0%,rgba(245,166,35,0.06) 100%);padding:40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="100" style="height:auto;display:block;margin:0 auto 16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/><h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#1a1008;letter-spacing:0.5px">🔄 Appointment Rescheduled</h1></td></tr><tr><td style="padding:40px"><div style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;backdrop-filter:blur(10px)"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient</span><br><span style="font-size:16px;color:#1a1008;font-weight:600">${patient?.full_name}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Old Date</span><br><span style="font-size:15px;color:#78716c;text-decoration:line-through">${oldDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 16px"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">New Date</span><br><span style="font-size:15px;color:#16a34a;font-weight:600">✓ ${newDateFmt} · ${new_time}</span></td></tr></table></div><div style="text-align:center;margin-top:32px"><a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;padding:14px 40px;border-radius:14px;text-decoration:none;box-shadow:0 4px 16px rgba(22,163,74,0.25);transition:all 0.3s ease">✓ Confirm Reschedule</a><p style="margin:16px 0 0;font-size:12px;color:#8b7c73">This action will notify our clinic of your approval.</p></div></td></tr><tr><td style="padding:24px 40px;text-align:center;background:linear-gradient(135deg,rgba(255,248,240,0.4),rgba(245,166,35,0.04));border-top:1px solid rgba(232,98,26,0.08)"><img src="${logoIcon}" alt="" width="28" style="height:auto;display:block;margin:0 auto 8px;opacity:0.6"/><p style="margin:0 0 4px;font-size:11px;color:#8b7c73;letter-spacing:0.3px">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:10px;color:#a8a29e">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}

function buildClinicPendingEmail({ patient, booking, treatmentList, formattedDate, amountLabel, confirmUrl, cancelUrl }: any) {
  const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
  const logoIcon = 'https://ayurshala-website.vercel.app/ayurshala.png'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}</style></head><body style="background:linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0);font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;padding:20px"><table width="100%" cellpadding="0" cellspacing="0" style="background:transparent"><tr><td align="center" style="padding:20px 0"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%);border:1px solid rgba(255,255,255,0.85);box-shadow:0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1);backdrop-filter:blur(40px)"><tr><td style="background:linear-gradient(135deg,rgba(232,98,26,0.08) 0%,rgba(245,166,35,0.06) 100%);padding:40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="100" style="height:auto;display:block;margin:0 auto 16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/><h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#1a1008;letter-spacing:0.5px">New Cash-on-Arrival Booking</h1></td></tr><tr><td style="padding:40px"><div style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;backdrop-filter:blur(10px)"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient</span><br><span style="font-size:16px;color:#1a1008;font-weight:600">${patient.full_name}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Phone</span><br><span style="font-size:15px;color:#78716c">${patient.phone || '—'}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Date & Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 16px"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Payment</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${amountLabel}</span></td></tr></table></div><div style="text-align:center;margin-top:32px;display:flex;gap:12px;justify-content:center"><a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;padding:14px 32px;border-radius:14px;text-decoration:none;box-shadow:0 4px 16px rgba(22,163,74,0.25)">Confirm</a><a href="${cancelUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;padding:14px 32px;border-radius:14px;text-decoration:none;box-shadow:0 4px 16px rgba(220,38,38,0.25)">Cancel</a></div></td></tr><tr><td style="padding:24px 40px;text-align:center;background:linear-gradient(135deg,rgba(255,248,240,0.4),rgba(245,166,35,0.04));border-top:1px solid rgba(232,98,26,0.08)"><img src="${logoIcon}" alt="" width="28" style="height:auto;display:block;margin:0 auto 8px;opacity:0.6"/><p style="margin:0 0 4px;font-size:11px;color:#8b7c73;letter-spacing:0.3px">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:10px;color:#a8a29e">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}

function buildEmailHtml({ patient, booking, treatmentList, formattedDate, amountLabel, isCod }: any) {
  const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
  const logoIcon = 'https://ayurshala-website.vercel.app/ayurshala.png'
  return (toClinic: boolean) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}</style></head><body style="background:linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0);font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;padding:20px"><table width="100%" cellpadding="0" cellspacing="0" style="background:transparent"><tr><td align="center" style="padding:20px 0"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%);border:1px solid rgba(255,255,255,0.85);box-shadow:0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1);backdrop-filter:blur(40px)"><tr><td style="background:linear-gradient(135deg,rgba(232,98,26,0.08) 0%,rgba(245,166,35,0.06) 100%);padding:40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="100" style="height:auto;display:block;margin:0 auto 16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/><h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#1a1008;letter-spacing:0.5px">${toClinic ? (isCod ? '🔔 New Cash-on-Arrival Booking' : '✓ Booking Confirmed') : (isCod ? '✓ Booking Received' : '✓ Booking Confirmed')}</h1></td></tr><tr><td style="padding:40px"><div style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;backdrop-filter:blur(10px)"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient</span><br><span style="font-size:16px;color:#1a1008;font-weight:600">${patient.full_name}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${patient.patient_id}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br><span style="font-size:15px;color:#1a1008">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Date &amp; Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 16px"><span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Payment</span><br><span style="font-size:15px;color:#1a1008">${amountLabel}</span></td></tr></table></div>${isCod && !toClinic ? '<p style="padding:16px 20px 0;font-size:13px;color:#6b7280;text-align:center">Our team will call you shortly to confirm your appointment. Thank you for booking with Ayurshala! 🙏</p>' : ''}</td></tr><tr><td style="padding:24px 40px;text-align:center;background:linear-gradient(135deg,rgba(255,248,240,0.4),rgba(245,166,35,0.04));border-top:1px solid rgba(232,98,26,0.08)"><img src="${logoIcon}" alt="" width="28" style="height:auto;display:block;margin:0 auto 8px;opacity:0.6"/><p style="margin:0 0 4px;font-size:11px;color:#8b7c73;letter-spacing:0.3px">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:10px;color:#a8a29e">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}
