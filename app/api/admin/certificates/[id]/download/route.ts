import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
// @ts-ignore
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 18 * 2.834

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

// Block dimensions (calculated once)
const HEADER_START_Y = BORDER_TOP - 20
const HEADER_HEIGHT = 70 + 24 + 14 + 14 + 10 + 10 + 10 + 14 + 9 + 28 + 16 + 30
const HEADER_END_Y = HEADER_START_Y - HEADER_HEIGHT

const FOOTER_HEIGHT = 25 + 25 + 12 + 35 + 60 + 12 + 8 + 16 + 16
const FOOTER_START_Y = BORDER_BOTTOM + FOOTER_HEIGHT
const AVAILABLE_HEIGHT = FOOTER_START_Y - HEADER_END_Y - SAFETY_MARGIN

function formatDate(d: string | null) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-IN')
  } catch {
    return String(d)
  }
}

function getNarrative(certType: string, cert: any) {
  const name = cert.patient.full_name
  const id = cert.patient.patient_id
  const issueDate = formatDate(cert.issue_date)
  const from = cert.valid_from ? formatDate(cert.valid_from) : 'date to be determined'
  const to = cert.valid_to ? formatDate(cert.valid_to) : 'date to be determined'

  const sections: { [key: string]: string } = {}

  switch (certType.toUpperCase()) {
    case 'SICK LEAVE CERTIFICATE':
      sections['intro'] = `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) was examined at Ayurshala Panchakarma Center on ${issueDate}.`
      sections['assessment'] = `Based on clinical assessment, the patient is advised complete medical rest from ${from} to ${to}.`
      sections['Reason for leave'] = cert.diagnosis || 'Medical evaluation'
      if (cert.recommendations) sections['Recommendations'] = cert.recommendations
      if (cert.restrictions) sections['Restrictions'] = cert.restrictions
      sections['conclusion'] = 'The patient is advised to resume normal activities only after the completion of the recommended rest period or upon further consultation.'
      break

    case 'MEDICAL FITNESS CERTIFICATE':
      sections['intro'] = `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has undergone a comprehensive medical examination at Ayurshala Panchakarma Center on ${issueDate}.`
      sections['assessment'] = `Based on the clinical assessment and medical evaluation, the patient is declared medically fit for ${cert.purpose || 'normal duties'}.`
      if (cert.diagnosis) sections['Clinical findings'] = cert.diagnosis
      if (cert.treatment_details) sections['Treatment provided'] = cert.treatment_details
      if (cert.recommendations) sections['Recommendations'] = cert.recommendations
      sections['validity'] = `This certificate is valid from ${cert.valid_from ? formatDate(cert.valid_from) : 'date of issue'} to ${cert.valid_to ? formatDate(cert.valid_to) : 'date of review'}.`
      break

    case 'CONSULTATION CERTIFICATE':
      sections['intro'] = `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) attended a consultation session at Ayurshala Panchakarma Center on ${issueDate}.`
      sections['Purpose'] = cert.purpose || 'Health evaluation'
      sections['Clinical assessment'] = cert.diagnosis || 'Medical consultation'
      if (cert.treatment_details) sections['Treatment recommendations'] = cert.treatment_details
      if (cert.recommendations) sections['Advised actions'] = cert.recommendations
      if (cert.restrictions) sections['Restrictions'] = cert.restrictions
      sections['conclusion'] = 'This certificate confirms the patient\'s participation in the consultation and the recommendations provided during the session.'
      break

    case 'PANCHAKARMA CERTIFICATE':
      sections['intro'] = `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has successfully completed Panchakarma treatment at Ayurshala Panchakarma Center from ${from} to ${to}.`
      sections['Treatment overview'] = cert.diagnosis || 'Panchakarma therapy'
      if (cert.treatment_details) sections['Treatment procedures'] = cert.treatment_details
      if (cert.recommendations) sections['Post-treatment recommendations'] = cert.recommendations
      if (cert.restrictions) sections['Lifestyle modifications'] = cert.restrictions
      if (cert.additional_notes) sections['Additional notes'] = cert.additional_notes
      sections['conclusion'] = 'The patient has completed the prescribed treatment protocol as per Ayurvedic principles.'
      break

    case 'TREATMENT CERTIFICATE':
      sections['intro'] = `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has undergone treatment at Ayurshala Panchakarma Center from ${from} to ${to}.`
      sections['Treatment type'] = cert.diagnosis || 'Therapeutic treatment'
      if (cert.treatment_details) sections['Details'] = cert.treatment_details
      if (cert.recommendations) sections['Follow-up recommendations'] = cert.recommendations
      if (cert.restrictions) sections['Restrictions'] = cert.restrictions
      sections['conclusion'] = 'The patient has completed the prescribed treatment course as recommended.'
      break

    case 'DISCHARGE SUMMARY CERTIFICATE':
      sections['intro'] = `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has been evaluated and discharged from Ayurshala Panchakarma Center on ${issueDate}.`
      sections['Presenting condition'] = cert.diagnosis || 'Medical evaluation completed'
      if (cert.treatment_details) sections['Treatment provided'] = cert.treatment_details
      if (cert.recommendations) sections['Discharge recommendations'] = cert.recommendations
      if (cert.restrictions) sections['Activity restrictions'] = cert.restrictions
      if (cert.additional_notes) sections['Additional instructions'] = cert.additional_notes
      sections['conclusion'] = 'The patient is discharged in stable condition with the above recommendations for continued care.'
      break

    default:
      sections['content'] = `Certificate for ${name} (ID: ${id}) issued on ${issueDate}.`
  }

  return sections
}

function splitLines(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.5
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('')
      continue
    }
    const words = para.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? current + ' ' + word : word
      if (test.length * charWidth > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawCenteredText(page: any, text: string, y: number, fontSize: number, color: any): void {
  // Consistent with header calculations: 0.55 * fontSize for Helvetica
  const textWidth = text.length * 0.55 * fontSize
  const x = BORDER_CENTER_X - textWidth / 2
  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    color: color,
  })
}

function drawBorder(page: any) {
  page.drawRectangle({
    x: BORDER_LEFT,
    y: BORDER_BOTTOM,
    width: BORDER_WIDTH,
    height: BORDER_TOP - BORDER_BOTTOM,
    borderColor: ORANGE,
    borderWidth: 1.5,
  })
}

function drawHeader(page: any, logo: any, certTitle: string): void {
  let y = HEADER_START_Y

  // Logo - centered
  page.drawImage(logo, {
    x: BORDER_CENTER_X - 35,
    y: y - 70,
    width: 70,
    height: 70,
  })
  y -= 70 + 24

  // Clinic name - using helvetica standard font
  const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
  const clinicFontSize = 14
  const clinicTextWidth = clinicText.length * 0.55 * clinicFontSize
  const clinicX = BORDER_LEFT + (BORDER_WIDTH - clinicTextWidth) / 2
  
  console.log('[CLINIC NAME] clinicX calculation:', {
    BORDER_LEFT,
    BORDER_WIDTH,
    clinicTextWidth,
    calculatedX: clinicX,
  })
  
  page.drawText(clinicText, {
    x: clinicX,
    y: y,
    size: clinicFontSize,
    color: BLACK,
  })
  y -= 14 + 14

  drawCenteredText(page, 'SP-28, Wajidpur,', y, 10, BLACK)
  y -= 10 + 6

  drawCenteredText(page, 'Sector-130, Noida – 201301', y, 10, BLACK)
  y -= 10 + 6

  drawCenteredText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', y, 9, GRAY)
  y -= 9 + 28

  // Certificate title
  const titleText = certTitle.toUpperCase()
  const titleFontSize = 16
  const titleTextWidth = titleText.length * 0.55 * titleFontSize
  const titleX = BORDER_LEFT + (BORDER_WIDTH - titleTextWidth) / 2
  
  console.log('[CERTIFICATE TITLE] titleX calculation:', {
    BORDER_LEFT,
    BORDER_WIDTH,
    titleTextWidth,
    calculatedX: titleX,
  })
  
  page.drawText(titleText, {
    x: titleX,
    y: y,
    size: titleFontSize,
    color: ORANGE,
  })
}

function drawFooter(page: any, qr: any, doctorName: string, startY: number, spacingMultiplier: number = 1.0, fontScale: number = 1.0): void {
  const SIG_WIDTH = 180
  const QR_SIZE = 60

  const patientX = BORDER_LEFT + 40
  const doctorX = BORDER_RIGHT - 220
  const doctorCenterX = doctorX + SIG_WIDTH / 2

  let y = startY

  page.drawLine({
    start: { x: patientX, y: y },
    end: { x: patientX + SIG_WIDTH, y: y },
    color: BLACK,
  })

  page.drawLine({
    start: { x: doctorX, y: y },
    end: { x: doctorX + SIG_WIDTH, y: y },
    color: BLACK,
  })

  y -= 25

  page.drawText('Patient Signature', {
    x: patientX,
    y: y,
    size: 10,
    color: BLACK,
  })

  page.drawText('Dr. ' + doctorName, {
    x: doctorX,
    y: y,
    size: 10 * fontScale,
    color: BLACK,
  })

  y -= 12

  page.drawText('Ayurshala Panchakarma Center', {
    x: doctorX,
    y: y,
    size: 9 * fontScale,
    color: BLACK,
  })

  y -= 35 * spacingMultiplier + 5

  const qrX = doctorX + (SIG_WIDTH - QR_SIZE) / 2

  page.drawImage(qr, {
    x: qrX,
    y: y - QR_SIZE,
    width: QR_SIZE,
    height: QR_SIZE,
  })

  y -= QR_SIZE + 12 * spacingMultiplier

  const scanText = 'Scan to verify authenticity'
  const scanWidth = scanText.length * (8 * fontScale) * 0.55
  page.drawText(scanText, {
    x: doctorCenterX - scanWidth / 2,
    y: y,
    size: 8 * fontScale,
    color: GRAY,
  })

  y -= 16 * spacingMultiplier

  const noteText1 = 'Electronically generated certificate.'
  const noteText2 = 'No physical signature required.'
  const noteWidth1 = noteText1.length * (8 * fontScale) * 0.55
  const noteWidth2 = noteText2.length * (8 * fontScale) * 0.55

  page.drawText(noteText1, {
    x: doctorCenterX - noteWidth1 / 2,
    y: y,
    size: 8 * fontScale,
    color: GRAY,
  })

  page.drawText(noteText2, {
    x: doctorCenterX - noteWidth2 / 2,
    y: y - 10,
    size: 8 * fontScale,
    color: GRAY,
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(
        `
        id, certificate_no,
        patient:patient_uuid(full_name, patient_id),
        certificate_type_id,
        issue_date, issued_by, valid_from, valid_to,
        purpose, diagnosis, treatment_details,
        recommendations, restrictions, additional_notes, status
      `
      )
      .eq('id', certificateId)
      .single()

    if (error || !certificate) {
      return NextResponse.json(
        { error: error ? String(error.message) : 'Certificate not found' },
        { status: 404 }
      )
    }

    const { data: ct, error: ctError } = await supabase
      .from('certificate_types')
      .select('name')
      .eq('id', certificate.certificate_type_id)
      .single()

    if (ctError || !ct) {
      return NextResponse.json({ error: 'Certificate type not found' }, { status: 404 })
    }

    if (certificate.status !== 'ISSUED') {
      return NextResponse.json({ error: 'Certificate not issued' }, { status: 403 })
    }

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json({ error: 'Logo missing' }, { status: 500 })
    }

    const logoBytes = fs.readFileSync(logoPath)
    const qrUrl = `${APP_URL}/certificates/verify?certificate=${encodeURIComponent(String(certificate.certificate_no))}`
    const qrCodeImage = await QRCode.toDataURL(qrUrl, { width: 100 })
    const qrBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64')

    const pdfDoc = await PDFDocument.create()
    const logo = await pdfDoc.embedPng(logoBytes)
    const qr = await pdfDoc.embedPng(qrBuffer)

    const narrative = getNarrative(ct.name, certificate)
    
    // Build inline label:value format
    const bodyParagraphs: string[] = []
    for (const [key, value] of Object.entries(narrative)) {
      if (!value?.trim()) continue
      if (key === 'intro' || key === 'assessment' || key === 'conclusion') {
        bodyParagraphs.push(value)
      } else {
        // Inline label format: "Label: content text..."
        bodyParagraphs.push(`${key}: ${value}`)
      }
    }
    
    // Split each paragraph into wrapped lines
    const bodyLines: string[] = []
    for (const para of bodyParagraphs) {
      const wrapped = splitLines(para, CONTENT_WIDTH, 11)
      bodyLines.push(...wrapped)
      bodyLines.push('') // 20px spacing between sections
    }
    
    console.log('Certificate body lines:', bodyLines)
    
    // Space optimization hierarchy
    const DEFAULT_CONTENT_FONT_SIZE = 11
    const MIN_CONTENT_FONT_SIZE = 9
    const AVAILABLE_HEIGHT = FOOTER_START_Y - HEADER_END_Y
    
    let contentFontSize = DEFAULT_CONTENT_FONT_SIZE
    let footerSpacingMultiplier = 1.0
    let footerFontScale = 1.0
    
    for (let fontSize = DEFAULT_CONTENT_FONT_SIZE; fontSize >= MIN_CONTENT_FONT_SIZE; fontSize -= 0.5) {
      const testLines = splitLines(bodyLines.join('\n'), CONTENT_WIDTH, fontSize)
      const lineHeight = fontSize * 1.5
      const block2Height = testLines.length * lineHeight
      const block3Height = FOOTER_HEIGHT * footerSpacingMultiplier
      const totalHeight = block2Height + block3Height
      
      if (totalHeight <= AVAILABLE_HEIGHT) {
        contentFontSize = fontSize
        break
      }
    }
    
    const lines = splitLines(bodyLines.join('\n'), CONTENT_WIDTH, contentFontSize)
    let contentLineHeight = contentFontSize * 1.5
    let block2Height = lines.length * contentLineHeight
    let remainingHeight = AVAILABLE_HEIGHT - block2Height
    
    if (remainingHeight < FOOTER_HEIGHT) {
      footerSpacingMultiplier = Math.max(0.5, remainingHeight / FOOTER_HEIGHT)
    }
    
    if (remainingHeight < FOOTER_HEIGHT * footerSpacingMultiplier) {
      footerFontScale = 0.88
    }

    let pages: any[] = []
    let lineIndex = 0
    let isFirstPage = true
    let lastContentPage: any = null
    let lastContentY = 0

    // Render pages
    while (lineIndex < lines.length || isFirstPage) {
      const currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      pages.push(currentPage)
      drawBorder(currentPage)

      // Block 1: Header only on page 1
      let contentY: number
      if (isFirstPage) {
        drawHeader(currentPage, logo, ct.name)
        contentY = HEADER_END_Y
        isFirstPage = false
      } else {
        // Continuation pages: start from top
        contentY = BORDER_TOP - 40
      }

      // Block 2: Content
      const pageStartLineIndex = lineIndex
      while (lineIndex < lines.length) {
        if (contentY - contentLineHeight < BORDER_BOTTOM + SAFETY_MARGIN) {
          break
        }

        currentPage.drawText(lines[lineIndex], {
          x: CONTENT_LEFT,
          y: contentY,
          size: contentFontSize,
          color: BLACK,
          maxWidth: CONTENT_WIDTH,
        })
        contentY -= contentLineHeight
        lineIndex++
      }

      lastContentPage = currentPage
      lastContentY = contentY

      // Prevent infinite loop
      if (lineIndex === pageStartLineIndex && lineIndex < lines.length) break
    }

    // Block 3: Footer placement - check if it fits on last content page
    const remainingSpace = lastContentY - BORDER_BOTTOM
    if (remainingSpace >= FOOTER_HEIGHT * footerSpacingMultiplier) {
      // Footer fits on last content page
      drawFooter(lastContentPage, qr, String(certificate.issued_by), lastContentY - SAFETY_MARGIN, footerSpacingMultiplier, footerFontScale)
    } else {
      // Create dedicated footer page
      const footerPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      drawBorder(footerPage)
      drawFooter(footerPage, qr, String(certificate.issued_by), BORDER_TOP - 40, 1.0, 1.0)
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${(certificate as any).certificate_no}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
