import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function launchBrowser() {
  const isVercel = !!process.env.VERCEL
  
  console.log('[PDF] Environment:', { isVercel, env: process.env.VERCEL_ENV })

  if (isVercel) {
    console.log('[PDF] Using puppeteer-core + chromium for Vercel')
    
    try {
      const chromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar'
      
      console.log('[PDF] Downloading Chromium from GitHub releases')
      const executable = await chromium.executablePath(chromiumUrl)
      console.log('[PDF] Chromium executable path:', executable)
      
      if (!executable) {
        throw new Error('Chromium executable path is undefined')
      }
      
      return await puppeteerCore.launch({
        args: chromium.args,
        executablePath: executable,
        headless: true,
      } as any)
    } catch (error) {
      console.error('[PDF] Failed to launch Chromium on Vercel:', error instanceof Error ? error.message : String(error))
      throw error
    }
  } else {
    console.log('[PDF] Using puppeteer-core for local development')
    return await puppeteerCore.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    } as any)
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  try {
    const rawBody = await req.json()
    const { booking_uuid } = rawBody

    if (!booking_uuid) {
      return NextResponse.json(
        { error: 'booking_uuid is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Load discharge summary from database
    const { data: summary, error: summaryError } = await supabase
      .from('discharge_summaries')
      .select('*')
      .eq('booking_id', booking_uuid)
      .single()

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Discharge summary not found. Please save first.' },
        { status: 404 }
      )
    }

    // Load logo as data URL
    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    let logoDataUrl = ''
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
    }

    // Build HTML with certificate-exact styling
    const html = buildDischargeSummaryHtml(summary, logoDataUrl)

    // Generate PDF with Puppeteer
    console.log('[PDF] Launching browser...')
    const browser = await launchBrowser()
    console.log('[PDF] Browser launched successfully')

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' } as any)

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
      printBackground: true,
      preferCSSPageSize: true,
    })

    console.log('[PDF] PDF generated, size:', pdfBuffer.length, 'bytes')

    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discharge_Summary_${summary.patient_uhid || 'PATIENT'}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-PDF-Renderer': 'puppeteer',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[PDF] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildDischargeSummaryHtml(summary: any, logoDataUrl: string): string {
  const complaints = Array.isArray(summary.complaints) ? summary.complaints : []
  const medicines = Array.isArray(summary.medicines) ? summary.medicines : []
  const therapies = Array.isArray(summary.therapies) ? summary.therapies : []

  // Build lifestyle section separately to avoid nested template literal issues
  let lifestyleHtml = ''
  if (summary.pathya || summary.apathya || summary.cautions) {
    lifestyleHtml = `
    <div class="section-title">LIFESTYLE & RESTRICTIONS</div>
    ${summary.pathya ? `<div class="content-block"><div class="subsection-label">Pathya (Recommended):</div><div class="subsection-value">${escapeHtml(summary.pathya)}</div></div>` : ''}
    ${summary.apathya ? `<div class="content-block"><div class="subsection-label">Apathya (Avoid):</div><div class="subsection-value">${escapeHtml(summary.apathya)}</div></div>` : ''}
    ${summary.cautions ? `<div class="content-block"><div class="subsection-label">Cautions:</div><div class="subsection-value">${escapeHtml(summary.cautions)}</div></div>` : ''}
    `
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discharge Summary - ${escapeHtml(summary.patient_name)}</title>
  <style>
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 12mm;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
    }

    body {
      font-family: Helvetica, Arial, sans-serif;
      background: white;
      color: #333;
      line-height: 1.55;
      font-size: 11px;
    }

    img,
    table,
    pre,
    code {
      max-width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    td,
    th {
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    p,
    li {
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* Page container - fixed A4 frame with complete border */
    .page {
      box-sizing: border-box;
      width: 100%;
      height: calc(297mm - 20mm);
      border: 2px solid #f97316;
      padding: 16mm;
      background: #fff;
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 0;
      flex-shrink: 0;
    }

    .logo {
      width: 26mm !important;
      max-width: 26mm !important;
      height: auto !important;
      display: block !important;
      margin: 0 auto 8px !important;
    }

    .clinic-name {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-top: 4px;
      margin-bottom: 8px;
      letter-spacing: 0.3px;
    }

    .clinic-address {
      font-size: 11px;
      font-weight: 400;
      color: #555;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .clinic-contact {
      font-size: 10.5px;
      font-weight: 400;
      color: #666;
      margin-bottom: 12px;
    }

    .divider {
      height: 1px;
      background: #f97316;
      opacity: 0.7;
      margin: 12px 0 14px;
    }

    .document-title {
      font-size: 18px;
      font-weight: 700;
      color: #f97316;
      letter-spacing: 1px;
      text-align: center;
      margin-bottom: 20px;
    }

    /* Section Titles */
    .section-title {
      font-size: 13px;
      font-weight: 700;
      padding-bottom: 6px;
      margin: 18px 0 10px 0;
      text-transform: uppercase;
      border-bottom: 2px solid #f97316;
      color: #f97316;
    }

    /* Data layout */
    .data-row {
      display: flex;
      gap: 20px;
      margin-bottom: 8px;
      font-size: 10.5px;
    }

    .data-field {
      flex: 1;
      min-width: 0;
    }

    .data-label {
      font-weight: 600;
      color: #222;
      font-size: 10.5px;
      margin-bottom: 2px;
    }

    .data-value {
      color: #444;
      font-weight: 400;
      font-size: 10.5px;
      word-break: break-word;
    }

    /* Lists */
    .list {
      margin-left: 16px;
      font-size: 10.5px;
    }

    .list-item {
      margin-bottom: 6px;
      color: #333;
      line-height: 1.45;
      word-break: break-word;
    }

    /* Tables */
    table {
      margin: 10px 0;
      font-size: 10px;
    }

    thead {
      background-color: #f97316;
      color: white;
    }

    th {
      padding: 8px;
      text-align: left;
      font-weight: 700;
      border: 0.5px solid #ddd;
      font-size: 10px;
    }

    td {
      padding: 8px;
      border: 0.5px solid #ddd;
      color: #333;
      font-size: 9.5px;
      line-height: 1.4;
    }

    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }

    /* Content blocks */
    .content-block {
      margin: 6px 0;
      font-size: 11px;
      color: #333;
      line-height: 1.55;
      word-break: break-word;
    }

    .subsection-label {
      font-weight: 600;
      color: #222;
      margin-bottom: 2px;
      font-size: 10.5px;
    }

    .subsection-value {
      margin-left: 0;
      color: #444;
      font-size: 10.5px;
      line-height: 1.55;
      word-break: break-word;
    }

    /* Content grows to fill available space */
    .content {
      flex: 1;
      overflow: hidden;
    }

    /* Footer stays at bottom */
    .footer {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      font-size: 9px;
      flex-shrink: 0;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid #111827;
      margin-bottom: 6px;
      height: 32px;
    }

    .signature-label {
      font-size: 9px;
      color: #111827;
      font-weight: 500;
    }

    page-break-inside: avoid;
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Ayurshala" class="logo" style="width: 26mm; max-width: 26mm; height: auto; display: block; margin: 0 auto 8px;" />` : ''}
      <div class="clinic-name">AYURSHALA PANCHAKARMA CENTER</div>
      <div class="clinic-address">
        SP-28, Wajidpur,<br />
        Sector-130, Noida – 201301
      </div>
      <div class="clinic-contact">+91-9821224767 | ayurshalapanchkarma@gmail.com</div>
      <div class="divider"></div>
      <div class="document-title">DISCHARGE SUMMARY</div>
    </div>

    <!-- Content (grows to fill space) -->
    <div class="content">
      <!-- Patient Information -->
      <div class="section-title">PATIENT INFORMATION</div>
      <div class="data-row">
        <div class="data-field">
          <div class="data-label">UHID</div>
          <div class="data-value">${escapeHtml(summary.patient_uhid || '—')}</div>
        </div>
        <div class="data-field">
          <div class="data-label">Patient Name</div>
          <div class="data-value">${escapeHtml(summary.patient_name || '—')}</div>
        </div>
        <div class="data-field">
          <div class="data-label">Age / Sex</div>
          <div class="data-value">${escapeHtml(summary.age || '')} / ${escapeHtml(summary.sex || '—')}</div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-field">
          <div class="data-label">Nationality</div>
          <div class="data-value">${escapeHtml(summary.nationality || '—')}</div>
        </div>
        <div class="data-field">
          <div class="data-label">Date of Discharge</div>
          <div class="data-value">${escapeHtml(summary.dod_date || '—')}</div>
        </div>
        <div class="data-field">
          <div class="data-label">Doctor</div>
          <div class="data-value">${escapeHtml(summary.doctor_name || '—')}</div>
        </div>
      </div>

      <!-- Admission & Discharge -->
      ${summary.doa_date || summary.dod_date ? `
      <div class="section-title">ADMISSION & DISCHARGE</div>
      <div class="data-row">
        <div class="data-field">
          <div class="data-label">Date of Admission</div>
          <div class="data-value">${escapeHtml(summary.doa_date || '')} ${escapeHtml(summary.doa_time || '')}</div>
        </div>
        <div class="data-field">
          <div class="data-label">Date of Discharge</div>
          <div class="data-value">${escapeHtml(summary.dod_date || '')} ${escapeHtml(summary.dod_time || '')}</div>
        </div>
      </div>
      ` : ''}

      <!-- Diagnosis -->
      ${summary.diagnosis ? `
      <div class="section-title">DIAGNOSIS</div>
      <div class="content-block">${escapeHtml(summary.diagnosis)}</div>
      ` : ''}

      <!-- Complaints -->
      ${complaints.length > 0 ? `
      <div class="section-title">COMPLAINTS ON ADMISSION</div>
      <div class="list">
        ${complaints.map((c: any) => `<div class="list-item">• ${escapeHtml(c)}</div>`).join('')}
      </div>
      ` : ''}

      <!-- Therapies -->
      ${therapies.length > 0 ? `
      <div class="section-title">THERAPIES / PROCEDURES</div>
      <div class="list">
        ${therapies.map((t: any) => `<div class="list-item">• ${escapeHtml(t)}</div>`).join('')}
      </div>
      ` : ''}

      <!-- Medicines -->
      ${medicines.length > 0 ? `
      <div class="section-title">MEDICATIONS</div>
      <table>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Instructions</th>
            <th>Schedule</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${medicines.map((m: any) => `
          <tr>
            <td>${escapeHtml(m.name || '')}</td>
            <td>${escapeHtml(m.dosage || '')}</td>
            <td>${escapeHtml(m.instructions || '')}</td>
            <td>${escapeHtml(m.schedule || '')}</td>
            <td>${escapeHtml(m.duration || '')}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <!-- Advice -->
      ${summary.advice_discharge ? `
      <div class="section-title">ADVICE ON DISCHARGE</div>
      <div class="content-block">${escapeHtml(summary.advice_discharge)}</div>
      ` : ''}

      <!-- Lifestyle -->
      ${lifestyleHtml}
    </div>

    <!-- Footer (stays at bottom) -->
    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Patient Signature</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Dr. ${escapeHtml(summary.doctor_name || '')}</div>
      </div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
