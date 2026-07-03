import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generate PDF using Puppeteer from database record
 * 
 * Supports both:
 * - Local development: Uses full Puppeteer with installed Chrome
 * - Vercel deployment: Uses puppeteer-core with @sparticuz/chromium
 */

async function launchBrowser() {
  const isVercel = !!process.env.VERCEL
  
  console.log('[PDF-V2] Environment:', { isVercel, env: process.env.VERCEL_ENV })

  if (isVercel) {
    // Vercel serverless environment
    console.log('[PDF-V2] Using puppeteer-core + chromium for Vercel')
    
    try {
      // For Vercel, @sparticuz/chromium downloads the binary from GitHub releases
      // Format: https://github.com/Sparticuz/chromium/releases/download/v<VERSION>/chromium-v<VERSION>-pack.<ARCH>.tar
      // Vercel runs on x64 architecture
      const chromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar'
      
      console.log('[PDF-V2] Downloading Chromium from GitHub releases')
      const executable = await chromium.executablePath(chromiumUrl)
      console.log('[PDF-V2] Chromium executable path:', executable)
      
      if (!executable) {
        throw new Error('Chromium executable path is undefined')
      }
      
      return await puppeteerCore.launch({
        args: chromium.args,
        executablePath: executable,
        headless: true,
      } as any)
    } catch (error) {
      console.error('[PDF-V2] Failed to launch Chromium on Vercel:', error instanceof Error ? error.message : String(error))
      throw error
    }
  } else {
    // Local development - use puppeteer-core without chromium
    console.log('[PDF-V2] Using puppeteer-core for local development (with local Chrome)')
    return await puppeteerCore.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    } as any)
  }
}

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
    const rawBody = await req.json()
    console.log('[PDF-V2] Raw request body:', JSON.stringify(rawBody, null, 2))
    
    const { booking_uuid } = rawBody

    console.log('[PDF-V2] Extracted booking_uuid:', booking_uuid, 'type:', typeof booking_uuid)

    if (!booking_uuid) {
      console.error('[PDF-V2] ERROR: booking_uuid is missing or empty')
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

    // Build HTML using React component
    console.log('[PDF-V2] Building HTML document with React...')
    const { renderToString } = require('react-dom/server')
    const { DischargeSummaryTemplate } = require('@/components/pdf/DischargeSummaryTemplate')
    
    const dischargeData = {
      patient_uhid: summary.patient_uhid || '',
      patient_name: summary.patient_name || '',
      age: summary.age || '',
      sex: summary.sex || '',
      nationality: summary.nationality || '',
      address: summary.address || '',
      doa_date: summary.doa_date || '',
      doa_time: summary.doa_time || '',
      dod_date: summary.dod_date || '',
      dod_time: summary.dod_time || '',
      diagnosis: summary.diagnosis || '',
      complaints: Array.isArray(summary.complaints) ? summary.complaints : [],
      history_present_complaints: summary.history_present_complaints || '',
      history_days: summary.history_days || '',
      past_history_medical: summary.past_history_medical || '',
      past_history_surgical: summary.past_history_surgical || '',
      past_history_details: summary.past_history_details || '',
      medication_administered: summary.medication_administered || '',
      day_of_therapy: summary.day_of_therapy || '',
      pradhan_vedna: Array.isArray(summary.pradhan_vedna) ? summary.pradhan_vedna : [],
      vitals_bp: summary.vitals_bp || '',
      vitals_hr: summary.vitals_hr || '',
      vitals_nadi: summary.vitals_nadi || '',
      oe_mala: summary.oe_mala || '',
      oe_mutra: summary.oe_mutra || '',
      oe_jihwa: summary.oe_jihwa || '',
      oe_shuda: summary.oe_shuda || '',
      oe_nidra: summary.oe_nidra || '',
      therapies: Array.isArray(summary.therapies) ? summary.therapies : [],
      investigations: summary.investigations || '',
      findings_discharge: summary.findings_discharge || '',
      condition_discharge: summary.condition_discharge || '',
      advice_discharge: summary.advice_discharge || '',
      medicine_discharge: summary.medicine_discharge || '',
      medicines: Array.isArray(summary.medicines) ? summary.medicines : [],
      cautions: summary.cautions || '',
      pathya: summary.pathya || '',
      apathya: summary.apathya || '',
      doctor_name: summary.doctor_name || '',
      booking_number: booking?.booking_id || '',
    }

    const reactHtml = renderToString(DischargeSummaryTemplate({ data: dischargeData }))
    
    // Wrap in full HTML document with styles
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discharge Summary - ${summary.patient_name || 'Patient'}</title>
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; background: white; }
    html, body { height: 100%; }
    @page { size: A4; margin: 0.5in; }
    .page-break-avoid { page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    .no-print { display: none; }
    @media print {
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  ${reactHtml}
</body>
</html>`
    
    console.log('[PDF-V2] HTML built, length:', html.length)

    // Generate PDF with Puppeteer
    console.log('[PDF-V2] Launching browser...')
    const browser = await launchBrowser()
    console.log('[PDF-V2] Browser launched successfully')

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

function buildDischargeSummaryHtml(summary: any, bookingNumber: string): string {
  // This function is deprecated - use React component instead
  throw new Error('Use React DischargeSummaryTemplate component instead')
}
