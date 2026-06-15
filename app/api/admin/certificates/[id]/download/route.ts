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
const GREEN = rgb(101 / 255, 163 / 255, 13 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const MM_TO_PT = 2.834
const MARGIN_MM = 15
const MARGIN = MARGIN_MM * MM_TO_PT
const INNER_MARGIN_MM = 4
const INNER_MARGIN = INNER_MARGIN_MM * MM_TO_PT
const CONTENT_MARGIN_MM = 12
const CONTENT_MARGIN = CONTENT_MARGIN_MM * MM_TO_PT
const LINE_HEIGHT_MULTIPLIER = 1.4
const FOOTER_MARGIN_MM = 15
const FOOTER_MARGIN = FOOTER_MARGIN_MM * MM_TO_PT

function formatDate(d: string | null) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-IN') } catch { return String(d) }
}

function getNarrative(certType: string, cert: any) {
  const name = cert.patient.full_name
  const id = cert.patient.patient_id
  const issueDate = formatDate(cert.issue_date)
  const from = cert.valid_from ? formatDate(cert.valid_from) : 'date to be determined'
  const to = cert.valid_to ? formatDate(cert.valid_to) : 'date to be determined'

  switch (certType.toUpperCase()) {
    case 'SICK LEAVE CERTIFICATE':
      return `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) was examined at Ayurshala Panchakarma Center on ${issueDate}.\n\nBased on clinical assessment, the patient is advised complete medical rest from ${from} to ${to}.\n\nReason for leave: ${cert.diagnosis || 'Medical evaluation'}${cert.recommendations ? '\n\nRecommendations: ' + cert.recommendations : ''}${cert.restrictions ? '\nRestrictions: ' + cert.restrictions : ''}\n\nThe patient is advised to resume normal activities only after the completion of the recommended rest period or upon further consultation.`

    case 'MEDICAL FITNESS CERTIFICATE':
      return `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has undergone a comprehensive medical examination at Ayurshala Panchakarma Center on ${issueDate}.\n\nBased on the clinical assessment and medical evaluation, the patient is declared medically fit for ${cert.purpose || 'normal duties'}.${cert.diagnosis ? '\n\nClinical findings: ' + cert.diagnosis : ''}${cert.treatment_details ? '\nTreatment provided: ' + cert.treatment_details : ''}${cert.recommendations ? '\n\nRecommendations: ' + cert.recommendations : ''}\n\nThis certificate is valid from ${cert.valid_from ? formatDate(cert.valid_from) : 'date of issue'} to ${cert.valid_to ? formatDate(cert.valid_to) : 'date of review'}.`

    case 'CONSULTATION CERTIFICATE':
      return `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) attended a consultation session at Ayurshala Panchakarma Center on ${issueDate}.\n\nPurpose of consultation: ${cert.purpose || 'Health evaluation'}\n\nClinical assessment: ${cert.diagnosis || 'Medical consultation'}${cert.treatment_details ? '\n\nTreatment recommendations: ' + cert.treatment_details : ''}${cert.recommendations ? '\nAdvised actions: ' + cert.recommendations : ''}${cert.restrictions ? '\nRestrictions to follow: ' + cert.restrictions : ''}\n\nThis certificate confirms the patient's participation in the consultation and the recommendations provided during the session.`

    case 'PANCHAKARMA CERTIFICATE':
      return `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has successfully completed Panchakarma treatment at Ayurshala Panchakarma Center from ${from} to ${to}.\n\nTreatment overview: ${cert.diagnosis || 'Panchakarma therapy'}${cert.treatment_details ? '\n\nTreatment procedures: ' + cert.treatment_details : ''}${cert.recommendations ? '\n\nPost-treatment recommendations: ' + cert.recommendations : ''}${cert.restrictions ? '\nLifestyle modifications advised: ' + cert.restrictions : ''}${cert.additional_notes ? '\nAdditional notes: ' + cert.additional_notes : ''}\n\nThe patient has completed the prescribed treatment protocol as per Ayurvedic principles.`

    case 'TREATMENT CERTIFICATE':
      return `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has undergone treatment at Ayurshala Panchakarma Center from ${from} to ${to}.\n\nTreatment type: ${cert.diagnosis || 'Therapeutic treatment'}${cert.treatment_details ? '\n\nDetails: ' + cert.treatment_details : ''}${cert.recommendations ? '\n\nFollow-up recommendations: ' + cert.recommendations : ''}${cert.restrictions ? '\nRestrictions: ' + cert.restrictions : ''}\n\nThe patient has completed the prescribed treatment course as recommended.`

    case 'DISCHARGE SUMMARY CERTIFICATE':
      return `This is to certify that Mr./Ms. ${name} (Patient ID: ${id}) has been evaluated and discharged from Ayurshala Panchakarma Center on ${issueDate}.\n\nPresenting condition: ${cert.diagnosis || 'Medical evaluation completed'}${cert.treatment_details ? '\n\nTreatment provided: ' + cert.treatment_details : ''}${cert.recommendations ? '\n\nDischarge recommendations: ' + cert.recommendations : ''}${cert.restrictions ? '\nActivity restrictions: ' + cert.restrictions : ''}${cert.additional_notes ? '\nAdditional instructions: ' + cert.additional_notes : ''}\n\nThe patient is discharged in stable condition with the above recommendations for continued care.`

    default:
      return `Certificate for ${name} (ID: ${id}) issued on ${issueDate}.`
  }
}

function splitIntoLines(text: string, maxWidth: number, fontSize: number): string[] {
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
      const testLine = current ? current + ' ' + word : word
      if (testLine.length * charWidth > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = testLine
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawBorders(page: any, width: number, height: number) {
  const outerX = MARGIN
  const outerY = MARGIN
  const outerW = width - MARGIN * 2
  const outerH = height - MARGIN * 2

  page.drawRectangle({
    x: outerX,
    y: outerY,
    width: outerW,
    height: outerH,
    borderColor: ORANGE,
    borderWidth: 1.5,
  })

  const innerX = outerX + INNER_MARGIN
  const innerY = outerY + INNER_MARGIN
  const innerW = outerW - INNER_MARGIN * 2
  const innerH = outerH - INNER_MARGIN * 2

  page.drawRectangle({
    x: innerX,
    y: innerY,
    width: innerW,
    height: innerH,
    borderColor: GREEN,
    borderWidth: 1,
  })
}

function drawFooter(page: any, width: number) {
  const footerY = MARGIN + FOOTER_MARGIN
  page.drawText('This certificate has been electronically generated by Ayurshala Panchakarma Center. No physical signature is required.', {
    x: MARGIN + CONTENT_MARGIN,
    y: footerY,
    size: 8,
    color: GRAY,
    maxWidth: width - (MARGIN + CONTENT_MARGIN) * 2,
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id, certificate_no,
        patient:patient_uuid(full_name, patient_id),
        certificate_type_id,
        issue_date, issued_by, valid_from, valid_to,
        purpose, diagnosis, treatment_details,
        recommendations, restrictions, additional_notes, status
      `)
      .eq('id', certificateId)
      .single()

    if (error || !certificate) {
      return NextResponse.json({ error: error ? String(error.message) : 'Certificate not found' }, { status: 404 })
    }

    const { data: certType, error: certTypeError } = await supabase
      .from('certificate_types')
      .select('name')
      .eq('id', certificate.certificate_type_id)
      .single()

    if (certTypeError || !certType) {
      return NextResponse.json({ error: 'Certificate type not found' }, { status: 404 })
    }

    if (certificate.status !== 'ISSUED') {
      return NextResponse.json({ error: 'Certificate not issued' }, { status: 403 })
    }

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    const logoBytes = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null

    const qrUrl = `${APP_URL}/certificates/verify?certificate=${encodeURIComponent(String(certificate.certificate_no))}`
    const qrCodeImage = await QRCode.toDataURL(qrUrl, { width: 100 })
    const qrBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64')

    const pdfDoc = await PDFDocument.create()
    const pageWidth = 595
    const pageHeight = 842

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
    drawBorders(currentPage, pageWidth, pageHeight)

    const contentX = MARGIN + CONTENT_MARGIN
    const contentWidth = pageWidth - (MARGIN + CONTENT_MARGIN) * 2
    const bodyWidth = contentWidth * 0.85
    const bodyX = pageWidth / 2 - bodyWidth / 2
    const bottomBoundary = MARGIN + CONTENT_MARGIN + 40
    let currentY = pageHeight - MARGIN - CONTENT_MARGIN - 20

    // Logo - centered
    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes)
        currentPage.drawImage(logoImage, {
          x: pageWidth / 2 - 35,
          y: currentY - 50,
          width: 70,
          height: 70,
        })
        currentY -= 90
      } catch (e) {
        currentY -= 20
      }
    }

    // Header - centered
    const headerWidth = 200
    currentPage.drawText('AYURSHALA PANCHAKARMA CENTER', {
      x: pageWidth / 2 - headerWidth / 2,
      y: currentY,
      size: 14,
      color: BLACK,
      maxWidth: headerWidth,
    })
    currentY -= 18

    const addressWidth = 250
    currentPage.drawText('SP-28, Wajidpur, Sector-130, Noida – 201301', {
      x: pageWidth / 2 - addressWidth / 2,
      y: currentY,
      size: 10,
      color: BLACK,
      maxWidth: addressWidth,
    })
    currentY -= 14

    const contactWidth = 320
    currentPage.drawText('+91-9821224767 | ayurshalapanchkarma@gmail.com', {
      x: pageWidth / 2 - contactWidth / 2,
      y: currentY,
      size: 9,
      color: GRAY,
      maxWidth: contactWidth,
    })
    currentY -= 28

    // Title - centered
    const titleWidth = 300
    currentPage.drawText(String(certType.name).toUpperCase(), {
      x: pageWidth / 2 - titleWidth / 2,
      y: currentY,
      size: 20,
      color: ORANGE,
      maxWidth: titleWidth,
    })
    currentY -= 32

    // Narrative - centered body
    const narrative = getNarrative(certType.name, certificate)
    const narrativeLines = splitIntoLines(narrative, bodyWidth, 12)
    const lineHeight = 12 * 1.6

    for (const line of narrativeLines) {
      if (currentY - lineHeight < bottomBoundary) {
        drawFooter(currentPage, pageWidth)
        currentPage = pdfDoc.addPage([pageWidth, pageHeight])
        drawBorders(currentPage, pageWidth, pageHeight)
        currentY = pageHeight - MARGIN - CONTENT_MARGIN - 20
      }
      currentPage.drawText(line, {
        x: bodyX,
        y: currentY,
        size: 12,
        color: BLACK,
        maxWidth: bodyWidth,
      })
      currentY -= lineHeight
    }

    currentY -= 12

    // Check if signature section fits
    const signatureHeight = 80
    if (currentY - signatureHeight < bottomBoundary) {
      drawFooter(currentPage, pageWidth)
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      drawBorders(currentPage, pageWidth, pageHeight)
      currentY = pageHeight - MARGIN - CONTENT_MARGIN - 20
    }

    // Signature section - balanced
    const sigLineY = currentY - 50
    const sigWidth = bodyWidth / 2

    currentPage.drawLine({
      start: { x: bodyX, y: sigLineY },
      end: { x: bodyX + sigWidth - 20, y: sigLineY },
      color: BLACK,
    })

    currentPage.drawText('Patient Signature', {
      x: bodyX,
      y: sigLineY - 15,
      size: 10,
      color: BLACK,
    })

    currentPage.drawLine({
      start: { x: bodyX + sigWidth + 20, y: sigLineY },
      end: { x: bodyX + bodyWidth, y: sigLineY },
      color: BLACK,
    })

    currentPage.drawText('Dr. ' + String(certificate.issued_by), {
      x: bodyX + sigWidth + 20,
      y: sigLineY - 15,
      size: 10,
      color: BLACK,
    })

    currentPage.drawText('Ayurshala Panchakarma Center', {
      x: bodyX + sigWidth + 20,
      y: sigLineY - 28,
      size: 9,
      color: BLACK,
    })

    // QR code - bottom right
    try {
      const qrImage = await pdfDoc.embedPng(qrBuffer)
      const qrSize = 60
      const qrX = pageWidth - MARGIN - CONTENT_MARGIN - qrSize
      const qrY = MARGIN + CONTENT_MARGIN + 20
      
      currentPage.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      })

      currentPage.drawText('Scan to verify\nauthenticity', {
        x: qrX,
        y: qrY - 20,
        size: 8,
        color: GRAY,
        maxWidth: qrSize,
      })
    } catch (e) {
      // QR embedding failed, continue without it
    }

    // Footer on last page - centered
    drawFooter(currentPage, pageWidth)

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
