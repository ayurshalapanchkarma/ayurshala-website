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
const CONTENT_LEFT = MARGIN + 15
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN + 15) * 2
const CERTIFICATION_SPACE = 180

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

function drawBorder(page: any) {
  page.drawRectangle({
    x: MARGIN,
    y: MARGIN,
    width: PAGE_WIDTH - MARGIN * 2,
    height: PAGE_HEIGHT - MARGIN * 2,
    borderColor: ORANGE,
    borderWidth: 1.5,
  })
}

function drawCenteredText(page: any, text: string, y: number, size: number, color: any, maxWidth: number): number {
  page.drawText(text, {
    x: PAGE_WIDTH / 2 - maxWidth / 2,
    y: y,
    size: size,
    color: color,
    maxWidth: maxWidth,
  })
  return y - (size + 2)
}

function drawHeaderBlock(page: any, logo: any, certTitle: string): number {
  let y = PAGE_HEIGHT - MARGIN - 20

  // Logo
  page.drawImage(logo, {
    x: PAGE_WIDTH / 2 - 35,
    y: y - 70,
    width: 70,
    height: 70,
  })
  y -= 70 + 16

  // Clinic name (centered, bold effect via size)
  y = drawCenteredText(page, 'AYURSHALA PANCHAKARMA CENTER', y, 14, BLACK, 280)
  y -= 6

  // Address lines (centered separately)
  y = drawCenteredText(page, 'SP-28, Wajidpur,', y, 10, BLACK, 200)
  y -= 2

  y = drawCenteredText(page, 'Sector-130, Noida – 201301', y, 10, BLACK, 200)
  y -= 8

  // Contact (centered, gray)
  y = drawCenteredText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', y, 9, GRAY, 280)
  y -= 18

  // Certificate title (centered, orange)
  y = drawCenteredText(page, certTitle.toUpperCase(), y, 16, ORANGE, 280)
  y -= 28

  return y
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
    const lines = splitLines(narrative, CONTENT_WIDTH - 20, 11)
    const lineHeight = 11 * 1.5

    let pages: any[] = []
    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    pages.push(currentPage)
    drawBorder(currentPage)

    let currentY = drawHeaderBlock(currentPage, logo, ct.name)

    // Draw body
    for (const line of lines) {
      if (currentY - lineHeight < MARGIN + CERTIFICATION_SPACE) {
        currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        pages.push(currentPage)
        drawBorder(currentPage)
        currentY = PAGE_HEIGHT - MARGIN - 20
      }

      currentPage.drawText(line, {
        x: CONTENT_LEFT,
        y: currentY,
        size: 11,
        color: BLACK,
        maxWidth: CONTENT_WIDTH - 20,
      })
      currentY -= lineHeight
    }

    // Certification block - FINAL PAGE ONLY (single Y cursor flow)
    const final = pages[pages.length - 1]
    let certY = currentY - 50

    const sigWidth = 70
    const patientSigX = CONTENT_LEFT
    const doctorSigX = CONTENT_LEFT + (CONTENT_WIDTH - 20) - sigWidth

    // Patient signature line
    final.drawLine({
      start: { x: patientSigX, y: certY },
      end: { x: patientSigX + sigWidth, y: certY },
      color: BLACK,
    })
    final.drawText('Patient Signature', {
      x: patientSigX,
      y: certY - 16,
      size: 10,
      color: BLACK,
    })

    // Doctor signature line (parallel)
    final.drawLine({
      start: { x: doctorSigX, y: certY },
      end: { x: doctorSigX + sigWidth, y: certY },
      color: BLACK,
    })

    certY -= 40

    // Doctor info block (right-aligned)
    final.drawText('Dr. ' + String(certificate.issued_by), {
      x: doctorSigX,
      y: certY,
      size: 10,
      color: BLACK,
    })
    certY -= 12

    final.drawText('Ayurshala Panchakarma Center', {
      x: doctorSigX,
      y: certY,
      size: 9,
      color: BLACK,
    })
    certY -= 25

    // QR - centered using doctor block as reference
    const qrSize = 60
    const doctorBlockCenterX = doctorSigX + sigWidth / 2
    const qrX = doctorBlockCenterX - qrSize / 2

    final.drawImage(qr, {
      x: qrX,
      y: certY - qrSize,
      width: qrSize,
      height: qrSize,
    })
    certY -= qrSize + 12

    // "Scan to verify authenticity" - centered
    final.drawText('Scan to verify authenticity', {
      x: PAGE_WIDTH / 2 - 70,
      y: certY,
      size: 8,
      color: GRAY,
      maxWidth: 140,
    })
    certY -= 15

    // Electronic note - centered
    final.drawText('Electronically generated certificate.\nNo physical signature required.', {
      x: PAGE_WIDTH / 2 - 100,
      y: certY,
      size: 8,
      color: GRAY,
      maxWidth: 200,
    })

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
