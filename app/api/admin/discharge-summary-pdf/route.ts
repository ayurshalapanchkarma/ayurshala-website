import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Design system - reused from certificates
const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)
const LIGHT_GRAY = rgb(243 / 255, 244 / 255, 246 / 255)
const WHITE = rgb(255 / 255, 255 / 255, 255 / 255)

// Page dimensions (A4)
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 18 * 2.834 // 18mm in points

// Border as single source of truth
const BORDER_LEFT = MARGIN
const BORDER_RIGHT = PAGE_WIDTH - MARGIN
const BORDER_TOP = PAGE_HEIGHT - MARGIN
const BORDER_BOTTOM = MARGIN
const BORDER_WIDTH = BORDER_RIGHT - BORDER_LEFT
const BORDER_CENTER_X = BORDER_LEFT + BORDER_WIDTH / 2

const CONTENT_LEFT = BORDER_LEFT + 20
const CONTENT_WIDTH = BORDER_WIDTH - 40
const SAFETY_MARGIN = 20

// Typography
const HEADER_FONT_SIZE = 14
const SECTION_TITLE_FONT_SIZE = 12
const BODY_FONT_SIZE = 10
const SMALL_FONT_SIZE = 9

function drawBorder(page: any) {
  page.drawRectangle({
    x: BORDER_LEFT,
    y: BORDER_BOTTOM,
    width: BORDER_WIDTH,
    height: BORDER_TOP - BORDER_BOTTOM,
    borderColor: ORANGE,
    borderWidth: 4,
  })
}

function drawCenteredText(page: any, text: string, y: number, fontSize: number, color: any): void {
  const textWidth = text.length * 0.55 * fontSize
  const x = BORDER_CENTER_X - textWidth / 2
  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    color: color,
  })
}

function drawHeader(page: any, logo: any): number {
  let y = BORDER_TOP - 20

  // Logo - 70px, centered
  page.drawImage(logo, {
    x: BORDER_CENTER_X - 35,
    y: y - 70,
    width: 70,
    height: 70,
  })
  y -= 70 + 16

  // Clinic name
  drawCenteredText(page, 'AYURSHALA PANCHAKARMA CENTER', y, HEADER_FONT_SIZE, BLACK)
  y -= HEADER_FONT_SIZE + 12

  // Address
  drawCenteredText(page, 'SP-28, Wajidpur,', y, 10, BLACK)
  y -= 10 + 4
  drawCenteredText(page, 'Sector-130, Noida – 201301', y, 10, BLACK)
  y -= 10 + 8

  // Contact
  drawCenteredText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', y, 9, GRAY)
  y -= 9 + 12

  // Divider
  page.drawLine({
    start: { x: CONTENT_LEFT, y: y },
    end: { x: BORDER_RIGHT - 20, y: y },
    color: ORANGE,
    width: 1,
  })
  y -= 8

  // Title
  drawCenteredText(page, 'DISCHARGE SUMMARY', y, 16, ORANGE)
  y -= 16 + 20

  return y
}

function drawSectionTitle(page: any, title: string, y: number): number {
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: y - SECTION_TITLE_FONT_SIZE - 4,
    width: CONTENT_WIDTH,
    height: SECTION_TITLE_FONT_SIZE + 8,
    color: ORANGE,
  })

  page.drawText(title.toUpperCase(), {
    x: CONTENT_LEFT + 8,
    y: y - SECTION_TITLE_FONT_SIZE - 2,
    size: SECTION_TITLE_FONT_SIZE,
    color: WHITE,
  })

  return y - SECTION_TITLE_FONT_SIZE - 12
}

function drawTwoColumnData(page: any, y: number, left: { label: string; value: string }, right: { label: string; value: string }): number {
  const midX = BORDER_CENTER_X

  // Left column
  page.drawText(left.label + ':', {
    x: CONTENT_LEFT,
    y: y,
    size: BODY_FONT_SIZE,
    color: BLACK,
  })
  page.drawText(left.value, {
    x: CONTENT_LEFT + 80,
    y: y,
    size: BODY_FONT_SIZE,
    color: BLACK,
  })

  // Right column
  page.drawText(right.label + ':', {
    x: midX + 20,
    y: y,
    size: BODY_FONT_SIZE,
    color: BLACK,
  })
  page.drawText(right.value, {
    x: midX + 100,
    y: y,
    size: BODY_FONT_SIZE,
    color: BLACK,
  })

  return y - BODY_FONT_SIZE - 8
}

export async function POST(req: NextRequest) {
  const { booking_uuid } = await req.json()

  if (!booking_uuid) {
    return NextResponse.json({ error: 'booking_uuid required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

  try {
    // Load discharge summary
    const { data: summary, error: summaryError } = await supabaseClient
      .from('discharge_summaries')
      .select('*')
      .eq('booking_id', booking_uuid)
      .single()

    if (summaryError || !summary) {
      return NextResponse.json({ error: 'Discharge summary not found' }, { status: 404 })
    }

    // Load logo
    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json({ error: 'Logo missing' }, { status: 500 })
    }
    const logoBytes = fs.readFileSync(logoPath)

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const logo = await pdfDoc.embedPng(logoBytes)

    // Generate QR code
    const qrUrl = `${APP_URL}/certificates/verify?document=discharge-${summary.id}`
    const qrCodeImage = await QRCode.toDataURL(qrUrl, { width: 100 })
    const qrBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64')
    const qr = await pdfDoc.embedPng(qrBuffer)

    // Create page
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    drawBorder(page)

    let y = drawHeader(page, logo)

    // Patient Information section
    y = drawSectionTitle(page, 'PATIENT INFORMATION', y)
    y = drawTwoColumnData(page, y, 
      { label: 'UHID', value: summary.patient_uhid || '—' },
      { label: 'Date', value: summary.dod_date || '—' }
    )
    y = drawTwoColumnData(page, y,
      { label: 'Patient', value: summary.patient_name || '—' },
      { label: 'Doctor', value: summary.doctor_name || '—' }
    )
    y = drawTwoColumnData(page, y,
      { label: 'Age / Sex', value: (summary.age ? summary.age + ' / ' : '') + (summary.sex || '—') },
      { label: 'Nationality', value: summary.nationality || '—' }
    )
    y -= 8

    // Admission/Discharge dates
    if (summary.doa_date || summary.dod_date) {
      y = drawSectionTitle(page, 'ADMISSION & DISCHARGE', y)
      y = drawTwoColumnData(page, y,
        { label: 'Admission', value: summary.doa_date ? `${summary.doa_date} ${summary.doa_time || ''}` : '—' },
        { label: 'Discharge', value: summary.dod_date ? `${summary.dod_date} ${summary.dod_time || ''}` : '—' }
      )
      y -= 8
    }

    // Diagnosis
    if (summary.diagnosis) {
      y = drawSectionTitle(page, 'DIAGNOSIS', y)
      page.drawText(summary.diagnosis, {
        x: CONTENT_LEFT,
        y: y,
        size: BODY_FONT_SIZE,
        color: BLACK,
        maxWidth: CONTENT_WIDTH,
      })
      y -= BODY_FONT_SIZE + 12
    }

    // Complaints
    if (summary.complaints && Array.isArray(summary.complaints) && summary.complaints.length > 0) {
      y = drawSectionTitle(page, 'COMPLAINTS ON ADMISSION', y)
      for (const complaint of summary.complaints) {
        page.drawText('• ' + complaint, {
          x: CONTENT_LEFT + 10,
          y: y,
          size: BODY_FONT_SIZE,
          color: BLACK,
          maxWidth: CONTENT_WIDTH - 20,
        })
        y -= BODY_FONT_SIZE + 6
      }
      y -= 2
    }

    // Therapies
    if (summary.therapies && Array.isArray(summary.therapies) && summary.therapies.length > 0) {
      y = drawSectionTitle(page, 'THERAPIES / PROCEDURES', y)
      for (const therapy of summary.therapies) {
        page.drawText('• ' + therapy, {
          x: CONTENT_LEFT + 10,
          y: y,
          size: BODY_FONT_SIZE,
          color: BLACK,
          maxWidth: CONTENT_WIDTH - 20,
        })
        y -= BODY_FONT_SIZE + 6
      }
      y -= 2
    }

    // Medicines
    if (summary.medicines && Array.isArray(summary.medicines) && summary.medicines.length > 0) {
      y = drawSectionTitle(page, 'MEDICATIONS', y)
      
      // Table header with orange background
      const tableHeaderY = y
      page.drawRectangle({
        x: CONTENT_LEFT,
        y: tableHeaderY - 16,
        width: CONTENT_WIDTH,
        height: 16,
        color: ORANGE,
      })

      const colWidths = [100, 70, 100, 70, 50]
      let xPos = CONTENT_LEFT + 4
      const headers = ['Medicine', 'Dosage', 'Instructions', 'Schedule', 'Duration']
      
      for (let i = 0; i < headers.length; i++) {
        page.drawText(headers[i], {
          x: xPos,
          y: tableHeaderY - 12,
          size: 8,
          color: WHITE,
        })
        xPos += colWidths[i]
      }

      y = tableHeaderY - 18

      // Table rows with zebra striping
      for (let idx = 0; idx < summary.medicines.length; idx++) {
        const med = summary.medicines[idx]
        const rowY = y - 2
        
        // Zebra striping
        if (idx % 2 === 1) {
          page.drawRectangle({
            x: CONTENT_LEFT,
            y: rowY - BODY_FONT_SIZE - 6,
            width: CONTENT_WIDTH,
            height: BODY_FONT_SIZE + 8,
            color: LIGHT_GRAY,
          })
        }

        // Draw row
        xPos = CONTENT_LEFT + 4
        const row = [med.name || '', med.dosage || '', med.instructions || '', med.schedule || '', med.duration || '']
        
        for (let i = 0; i < row.length; i++) {
          page.drawText(row[i].substring(0, 20), {
            x: xPos,
            y: rowY,
            size: 8,
            color: BLACK,
          })
          xPos += colWidths[i]
        }

        // Row border
        page.drawRectangle({
          x: CONTENT_LEFT,
          y: rowY - BODY_FONT_SIZE - 6,
          width: CONTENT_WIDTH,
          height: BODY_FONT_SIZE + 8,
          borderColor: GRAY,
          borderWidth: 0.5,
        })

        y -= BODY_FONT_SIZE + 10
      }

      y -= 4
    }

    // Advice
    if (summary.advice_discharge) {
      y = drawSectionTitle(page, 'ADVICE ON DISCHARGE', y)
      page.drawText(summary.advice_discharge, {
        x: CONTENT_LEFT,
        y: y,
        size: BODY_FONT_SIZE,
        color: BLACK,
        maxWidth: CONTENT_WIDTH,
      })
      y -= BODY_FONT_SIZE + 12
    }

    // Pathya / Apathya
    if (summary.pathya || summary.apathya || summary.cautions) {
      y = drawSectionTitle(page, 'LIFESTYLE & RESTRICTIONS', y)
      
      if (summary.pathya) {
        page.drawText('Pathya (Recommended):', {
          x: CONTENT_LEFT,
          y: y,
          size: BODY_FONT_SIZE,
          color: ORANGE,
        })
        page.drawText(summary.pathya, {
          x: CONTENT_LEFT + 10,
          y: y - 10,
          size: BODY_FONT_SIZE - 1,
          color: BLACK,
          maxWidth: CONTENT_WIDTH - 20,
        })
        y -= 24
      }

      if (summary.apathya) {
        page.drawText('Apathya (Avoid):', {
          x: CONTENT_LEFT,
          y: y,
          size: BODY_FONT_SIZE,
          color: ORANGE,
        })
        page.drawText(summary.apathya, {
          x: CONTENT_LEFT + 10,
          y: y - 10,
          size: BODY_FONT_SIZE - 1,
          color: BLACK,
          maxWidth: CONTENT_WIDTH - 20,
        })
        y -= 24
      }

      if (summary.cautions) {
        page.drawText('Cautions:', {
          x: CONTENT_LEFT,
          y: y,
          size: BODY_FONT_SIZE,
          color: ORANGE,
        })
        page.drawText(summary.cautions, {
          x: CONTENT_LEFT + 10,
          y: y - 10,
          size: BODY_FONT_SIZE - 1,
          color: BLACK,
          maxWidth: CONTENT_WIDTH - 20,
        })
        y -= 24
      }
    }

    y -= 20

    // Footer
    const SIG_WIDTH = 160
    const QR_SIZE = 50
    const patientX = CONTENT_LEFT
    const doctorX = BORDER_RIGHT - SIG_WIDTH - 20

    // Signature lines
    page.drawLine({
      start: { x: patientX, y: y },
      end: { x: patientX + SIG_WIDTH, y: y },
      color: BLACK,
      width: 1,
    })

    page.drawLine({
      start: { x: doctorX, y: y },
      end: { x: doctorX + SIG_WIDTH, y: y },
      color: BLACK,
      width: 1,
    })

    page.drawText('Patient Signature', {
      x: patientX,
      y: y - 12,
      size: 9,
      color: BLACK,
    })

    page.drawText('Dr. ' + (summary.doctor_name || ''), {
      x: doctorX,
      y: y - 12,
      size: 9,
      color: BLACK,
    })

    page.drawText('Ayurshala Panchakarma Center', {
      x: doctorX,
      y: y - 22,
      size: 8,
      color: BLACK,
    })

    // QR Code
    const qrX = doctorX + (SIG_WIDTH - QR_SIZE) / 2
    page.drawImage(qr, {
      x: qrX,
      y: BORDER_BOTTOM + 20,
      width: QR_SIZE,
      height: QR_SIZE,
    })

    page.drawText('Scan to verify', {
      x: doctorX + 30,
      y: BORDER_BOTTOM + 10,
      size: 7,
      color: GRAY,
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discharge_Summary_${summary.patient_uhid || 'PATIENT'}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-PDF-Renderer': 'pdf-lib',
      },
    })
  } catch (error) {
    console.error('[Discharge PDF]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
