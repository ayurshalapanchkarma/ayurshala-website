import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

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

    // Build HTML with certificate-style CSS
    const html = buildDischargeSummaryHtml(summary)

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

function buildDischargeSummaryHtml(summary: any): string {
  const complaints = Array.isArray(summary.complaints) ? summary.complaints : []
  const medicines = Array.isArray(summary.medicines) ? summary.medicines : []
  const therapies = Array.isArray(summary.therapies) ? summary.therapies : []

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
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: white;
      color: #111827;
      line-height: 1.5;
    }

    @page {
      size: A4;
      margin: 18mm;
    }

    .container {
      max-width: 210mm;
      background: white;
      border: 4px solid #f97316;
      padding: 20px;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #f97316;
      padding-bottom: 16px;
    }

    .logo {
      max-width: 70px;
      height: auto;
      margin: 0 auto 16px;
      display: block;
    }

    .clinic-name {
      font-size: 14px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .clinic-address {
      font-size: 10px;
      color: #6b7280;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .clinic-contact {
      font-size: 9px;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .document-title {
      font-size: 16px;
      font-weight: bold;
      color: #f97316;
      margin-top: 12px;
      letter-spacing: 0.5px;
    }

    /* Section Titles */
    .section-title {
      background-color: #f97316;
      color: white;
      font-size: 12px;
      font-weight: bold;
      padding: 8px 12px;
      margin: 24px 0 12px 0;
      text-transform: uppercase;
    }

    /* Data rows */
    .data-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 12px;
      font-size: 10px;
    }

    .data-field {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
    }

    .data-label {
      font-weight: bold;
      color: #111827;
      white-space: nowrap;
    }

    .data-value {
      color: #111827;
    }

    /* Lists */
    .list {
      margin-left: 20px;
      font-size: 10px;
    }

    .list-item {
      margin-bottom: 8px;
      color: #111827;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10px;
    }

    thead {
      background-color: #f97316;
      color: white;
    }

    th {
      padding: 8px;
      text-align: left;
      font-weight: bold;
      border: 0.5px solid #d1d5db;
    }

    td {
      padding: 8px;
      border: 0.5px solid #d1d5db;
      color: #111827;
    }

    tbody tr:nth-child(even) {
      background-color: #f3f4f6;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      font-size: 9px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid #111827;
      margin-bottom: 8px;
      height: 40px;
    }

    .signature-label {
      font-size: 9px;
      color: #111827;
    }

    /* Content blocks */
    .content-block {
      margin: 12px 0;
      font-size: 10px;
      color: #111827;
      line-height: 1.5;
    }

    .subsection-label {
      font-weight: bold;
      color: #f97316;
      margin-bottom: 4px;
    }

    .subsection-value {
      margin-left: 12px;
      color: #111827;
    }

    page-break-inside: avoid;
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="/ayurshala_text.png" alt="Ayurshala" class="logo" />
      <div class="clinic-name">AYURSHALA PANCHAKARMA CENTER</div>
      <div class="clinic-address">
        SP-28, Wajidpur,<br />
        Sector-130, Noida – 201301
      </div>
      <div class="clinic-contact">+91-9821224767 | ayurshalapanchkarma@gmail.com</div>
      <div class="document-title">DISCHARGE SUMMARY</div>
    </div>

    <!-- Patient Information -->
    <div class="section-title">PATIENT INFORMATION</div>
    <div class="data-row">
      <div class="data-field">
        <span class="data-label">UHID:</span>
        <span class="data-value">${escapeHtml(summary.patient_uhid || '—')}</span>
      </div>
      <div class="data-field">
        <span class="data-label">Date:</span>
        <span class="data-value">${escapeHtml(summary.dod_date || '—')}</span>
      </div>
    </div>
    <div class="data-row">
      <div class="data-field">
        <span class="data-label">Patient:</span>
        <span class="data-value">${escapeHtml(summary.patient_name || '—')}</span>
      </div>
      <div class="data-field">
        <span class="data-label">Doctor:</span>
        <span class="data-value">${escapeHtml(summary.doctor_name || '—')}</span>
      </div>
    </div>
    <div class="data-row">
      <div class="data-field">
        <span class="data-label">Age / Sex:</span>
        <span class="data-value">${escapeHtml(summary.age || '')} / ${escapeHtml(summary.sex || '—')}</span>
      </div>
      <div class="data-field">
        <span class="data-label">Nationality:</span>
        <span class="data-value">${escapeHtml(summary.nationality || '—')}</span>
      </div>
    </div>

    <!-- Admission & Discharge -->
    ${summary.doa_date || summary.dod_date ? `
    <div class="section-title">ADMISSION & DISCHARGE</div>
    <div class="data-row">
      <div class="data-field">
        <span class="data-label">Admission:</span>
        <span class="data-value">${escapeHtml(summary.doa_date || '')} ${escapeHtml(summary.doa_time || '')}</span>
      </div>
      <div class="data-field">
        <span class="data-label">Discharge:</span>
        <span class="data-value">${escapeHtml(summary.dod_date || '')} ${escapeHtml(summary.dod_time || '')}</span>
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
      ${complaints.map(c => `<div class="list-item">• ${escapeHtml(c)}</div>`).join('')}
    </div>
    ` : ''}

    <!-- Therapies -->
    ${therapies.length > 0 ? `
    <div class="section-title">THERAPIES / PROCEDURES</div>
    <div class="list">
      ${therapies.map(t => `<div class="list-item">• ${escapeHtml(t)}</div>`).join('')}
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
        ${medicines.map(m => `
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
    ${summary.pathya || summary.apathya || summary.cautions ? `
    <div class="section-title">LIFESTYLE & RESTRICTIONS</div>
    ${summary.pathya ? `
    <div class="content-block">
      <div class="subsection-label">Pathya (Recommended)</div>
      <div class="subsection-value">${escapeHtml(summary.pathya)}</div>
    </div>
    ` : ''}
    ${summary.apathya ? `
    <div class="content-block">
      <div class="subsection-label">Apathya (Avoid)</div>
      <div class="subsection-value">${escapeHtml(summary.apathya)}</div>
    </div>
    ` : ''}
    ${summary.cautions ? `
    <div class="content-block">
      <div class="subsection-label">Cautions</div>
      <div class="subsection-value">${escapeHtml(summary.cautions)}</div>
    </div>
    ` : ''}
    ` : ''}

    <!-- Footer -->
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
