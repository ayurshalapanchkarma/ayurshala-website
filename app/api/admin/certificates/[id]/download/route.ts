import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, PDFPage, rgb, degrees } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = []
  const words = text.split(' ')
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    const estimatedWidth = testLine.length * (fontSize * 0.5)
    if (estimatedWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
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
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json({ error: 'Logo missing' }, { status: 500 })
    }
    const logoBytes = fs.readFileSync(logoPath)

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    const margin = 36
    const borderMargin = 12 * 2.834
    const borderX = borderMargin
    const borderY = borderMargin
    const borderWidth = width - borderMargin * 2
    const borderHeight = height - borderMargin * 2

    page.drawRectangle({
      x: borderX,
      y: borderY,
      width: borderWidth,
      height: borderHeight,
      borderColor: rgb(249 / 255, 115 / 255, 22 / 255),
      borderWidth: 2,
    })

    const contentX = borderX + 15 * 2.834
    const contentY = borderY + borderHeight - 15 * 2.834
    const contentWidth = borderWidth - 30 * 2.834

    try {
      const logoImage = await pdfDoc.embedPng(logoBytes)
      const logoSize = 70
      page.drawImage(logoImage, {
        x: width / 2 - logoSize / 2,
        y: contentY - logoSize - 20,
        width: logoSize,
        height: logoSize,
      })
    } catch (e) {
      // Logo embedding failed, continue without it
    }

    let currentY = contentY - 110

    page.drawText('AYURSHALA PANCHAKARMA CENTER', {
      x: contentX,
      y: currentY,
      size: 14,
      color: rgb(17 / 255, 24 / 255, 39 / 255),
      maxWidth: contentWidth,
    })
    currentY -= 16

    page.drawText('SP-28, Wajidpur,', {
      x: contentX,
      y: currentY,
      size: 10,
      color: rgb(17 / 255, 24 / 255, 39 / 255),
      maxWidth: contentWidth,
    })
    currentY -= 12

    page.drawText('Sector-130, Noida – 201301', {
      x: contentX,
      y: currentY,
      size: 10,
      color: rgb(17 / 255, 24 / 255, 39 / 255),
      maxWidth: contentWidth,
    })
    currentY -= 12

    page.drawText('+91-9821224767', {
      x: contentX,
      y: currentY,
      size: 9,
      color: rgb(107 / 255, 114 / 255, 128 / 255),
      maxWidth: contentWidth,
    })
    currentY -= 10

    page.drawText('ayurshalapanchkarma@gmail.com', {
      x: contentX,
      y: currentY,
      size: 9,
      color: rgb(107 / 255, 114 / 255, 128 / 255),
      maxWidth: contentWidth,
    })
    currentY -= 25

    page.drawText(String(certType.name).toUpperCase(), {
      x: contentX,
      y: currentY,
      size: 20,
      color: rgb(249 / 255, 115 / 255, 22 / 255),
      maxWidth: contentWidth,
    })
    currentY -= 35

    const narrative = getNarrative(certType.name, certificate)
    const narrativeLines = wrapText(narrative, contentWidth - 20, 11)

    for (const line of narrativeLines) {
      page.drawText(line, {
        x: contentX,
        y: currentY,
        size: 11,
        color: rgb(17 / 255, 24 / 255, 39 / 255),
        maxWidth: contentWidth,
      })
      currentY -= 16
    }

    currentY -= 15

    const signLineY = currentY - 30
    const sigWidth = (contentWidth - 40) / 2

    page.drawLine({
      start: { x: contentX, y: signLineY },
      end: { x: contentX + sigWidth - 20, y: signLineY },
      color: rgb(17 / 255, 24 / 255, 39 / 255),
    })

    page.drawText('Patient Signature', {
      x: contentX,
      y: signLineY - 15,
      size: 10,
      color: rgb(17 / 255, 24 / 255, 39 / 255),
    })

    page.drawLine({
      start: { x: contentX + sigWidth + 20, y: signLineY },
      end: { x: contentX + contentWidth - 40, y: signLineY },
      color: rgb(17 / 255, 24 / 255, 39 / 255),
    })

    page.drawText('Dr. ' + String(certificate.issued_by), {
      x: contentX + sigWidth + 20,
      y: signLineY - 15,
      size: 10,
      color: rgb(17 / 255, 24 / 255, 39 / 255),
    })

    page.drawText('Ayurshala Panchakarma Center', {
      x: contentX + sigWidth + 20,
      y: signLineY - 28,
      size: 9,
      color: rgb(17 / 255, 24 / 255, 39 / 255),
    })

    const footerY = borderY + 10
    page.drawText('This certificate has been electronically generated by Ayurshala Panchakarma Center.', {
      x: contentX,
      y: footerY + 8,
      size: 8,
      color: rgb(107 / 255, 114 / 255, 128 / 255),
      maxWidth: contentWidth,
    })

    page.drawText('No physical signature is required.', {
      x: contentX,
      y: footerY - 2,
      size: 8,
      color: rgb(107 / 255, 114 / 255, 128 / 255),
      maxWidth: contentWidth,
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
