import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generate PDF using Puppeteer from database record
 * 
 * Flow:
 * 1. Receive booking_uuid
 * 2. Load discharge summary from database
 * 3. Build HTML directly
 * 4. Use Puppeteer to render HTML to PDF
 * 5. Return PDF
 */

export async function POST(req: NextRequest) {
  const COMMIT_HASH = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'
  const ENVIRONMENT = process.env.VERCEL_ENV || 'local'

  console.log('=== PUPPETEER PDF V2 ===')
  console.log('[PDF-V2] Request received', {
    commit: COMMIT_HASH,
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString(),
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  try {
    const { booking_uuid } = await req.json()

    if (!booking_uuid) {
      return NextResponse.json(
        { error: 'booking_uuid is required' },
        { status: 400 }
      )
    }

    console.log('[PDF-V2] Loading discharge summary for:', booking_uuid)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Load discharge summary from database
    const { data: summary, error: summaryError } = await supabase
      .from('discharge_summaries')
      .select('*')
      .eq('booking_id', booking_uuid)
      .single()

    if (summaryError || !summary) {
      console.error('[PDF-V2] Discharge summary not found:', summaryError?.message)
      return NextResponse.json(
        { error: 'Discharge summary not found. Please save first.' },
        { status: 404 }
      )
    }

    console.log('[PDF-V2] Discharge summary loaded, ID:', summary.id)

    // Load booking details
    const { data: booking } = await supabase
      .from('bookings_new')
      .select('booking_id')
      .eq('booking_uuid', booking_uuid)
      .single()

    // Build HTML
    console.log('[PDF-V2] Building HTML document...')
    const html = buildDischargeSummaryHtml(summary, booking?.booking_id || '')
    console.log('[PDF-V2] HTML built, length:', html.length)

    // Generate PDF with Puppeteer
    console.log('[PDF-V2] Launching Puppeteer...')
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    } as any)

    const page = await browser.newPage()
    console.log('[PDF-V2] Page created')

    await page.setContent(html, { waitUntil: 'domcontentloaded' } as any)
    console.log('[PDF-V2] HTML content set')

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      printBackground: true,
      preferCSSPageSize: true,
    })

    console.log('[PDF-V2] PDF generated, size:', pdfBuffer.length, 'bytes')

    await browser.close()
    console.log('[PDF-V2] Browser closed')

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discharge_Summary_${summary.patient_uhid || 'PATIENT'}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-PDF-Renderer': 'puppeteer',
        'X-PDF-Version': '2',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''
    console.error('[PDF-V2] Error:', message)
    console.error('[PDF-V2] Stack:', stack)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

function escape(text: any): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildDischargeSummaryHtml(summary: any, bookingNumber: string): string {
  const complaints = Array.isArray(summary.complaints) ? summary.complaints : []
  const medicines = Array.isArray(summary.medicines) ? summary.medicines : []
  const therapies = Array.isArray(summary.therapies) ? summary.therapies : []

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discharge Summary - ${escape(summary.patient_name)}</title>
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 20px; background: white; font-family: system-ui, sans-serif; }
    .container { max-width: 210mm; margin: 0 auto; background: white; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #f97316; padding-bottom: 16px; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; }
    .clinic-name { font-size: 16px; font-weight: 600; margin-top: 8px; }
    .clinic-info { font-size: 12px; color: #666; margin-top: 4px; }
    .title { font-size: 20px; font-weight: bold; color: #f97316; margin: 20px 0; text-align: center; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: 700; color: white; background: #f97316; padding: 8px 12px; margin-bottom: 12px; }
    .row { display: flex; gap: 20px; margin-bottom: 12px; }
    .field { flex: 1; }
    .label { font-weight: 600; font-size: 12px; color: #666; }
    .value { font-size: 13px; color: #333; margin-top: 4px; }
    .list { margin-left: 20px; }
    .list-item { margin-bottom: 8px; font-size: 13px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    thead { background: #f3f4f6; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    th { font-weight: 600; }
    .signature-block { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .signature-line { width: 200px; border-top: 1px solid #000; margin-top: 40px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">AYURSHALA</div>
      <div class="clinic-name">PANCHAKARMA CENTER</div>
      <div class="clinic-info">SP-28, Wajidpur, Sector-130, Noida – 201301</div>
      <div class="clinic-info">+91-9821224767 | ayurshalapanchkarma@gmail.com</div>
    </div>

    <div class="title">DISCHARGE SUMMARY</div>

    <div class="section">
      <div class="section-title">PATIENT INFORMATION</div>
      <div class="row">
        <div class="field">
          <div class="label">UHID</div>
          <div class="value">${escape(summary.patient_uhid)}</div>
        </div>
        <div class="field">
          <div class="label">Patient Name</div>
          <div class="value">${escape(summary.patient_name)}</div>
        </div>
        <div class="field">
          <div class="label">Age / Sex</div>
          <div class="value">${escape(summary.age)} / ${escape(summary.sex)}</div>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <div class="label">Nationality</div>
          <div class="value">${escape(summary.nationality)}</div>
        </div>
        <div class="field">
          <div class="label">Booking #</div>
          <div class="value">${escape(bookingNumber)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="row">
        <div class="field">
          <div class="label">Date of Admission</div>
          <div class="value">${escape(summary.doa_date)} ${escape(summary.doa_time)}</div>
        </div>
        <div class="field">
          <div class="label">Date of Discharge</div>
          <div class="value">${escape(summary.dod_date)} ${escape(summary.dod_time)}</div>
        </div>
      </div>
    </div>

    ${summary.diagnosis ? `<div class="section"><div class="section-title">DIAGNOSIS</div><div class="value">${escape(summary.diagnosis)}</div></div>` : ''}

    ${complaints.length > 0 ? `<div class="section"><div class="section-title">COMPLAINTS ON ADMISSION</div><div class="list">${complaints.map((c: any, i: number) => `<div class="list-item">${i + 1}. ${escape(c)}</div>`).join('')}</div></div>` : ''}

    ${summary.history_present_complaints ? `<div class="section"><div class="section-title">HISTORY OF PRESENT COMPLAINTS</div><div class="value">${escape(summary.history_present_complaints)}</div></div>` : ''}

    ${therapies.length > 0 ? `<div class="section"><div class="section-title">THERAPIES / PROCEDURES</div><div class="list">${therapies.map((t: any, i: number) => `<div class="list-item">${i + 1}. ${escape(t)}</div>`).join('')}</div></div>` : ''}

    ${medicines.length > 0 ? `<div class="section"><div class="section-title">MEDICINES</div><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Instructions</th><th>Schedule</th><th>Duration</th></tr></thead><tbody>${medicines.map((m: any) => `<tr><td>${escape(m.name)}</td><td>${escape(m.dosage)}</td><td>${escape(m.instructions)}</td><td>${escape(m.schedule)}</td><td>${escape(m.duration)}</td></tr>`).join('')}</tbody></table></div>` : ''}

    ${summary.advice_discharge ? `<div class="section"><div class="section-title">ADVICE ON DISCHARGE</div><div class="value">${escape(summary.advice_discharge)}</div></div>` : ''}

    ${summary.pathya || summary.apathya || summary.cautions ? `<div class="section">${summary.pathya ? `<div><strong>Pathya:</strong> ${escape(summary.pathya)}</div>` : ''}${summary.apathya ? `<div><strong>Apathya:</strong> ${escape(summary.apathya)}</div>` : ''}${summary.cautions ? `<div><strong>Cautions:</strong> ${escape(summary.cautions)}</div>` : ''}</div>` : ''}

    <div class="signature-block">
      <div style="float: right; text-align: center;">
        <div class="signature-line"></div>
        <div style="font-size: 12px; font-weight: 600; margin-top: 4px;">${escape(summary.doctor_name)}</div>
      </div>
      <div style="clear: both;"></div>
    </div>
  </div>
</body>
</html>`
}
