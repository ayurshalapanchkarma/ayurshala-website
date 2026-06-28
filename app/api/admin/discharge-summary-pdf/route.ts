import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

function sanitizeText(text: string): string {
  if (!text) return text
  return text.replace(/₂/g, '2').replace(/₃/g, '3').replace(/SpO₂/g, 'SpO2').replace(/CO₂/g, 'CO2').replace(/O₂/g, 'O2')
}

function addText(page: any, text: string, x: number, y: number, size: number = 10) {
  page.drawText(sanitizeText(text || ''), { x, y, size })
}

function drawOrangeBorder(page: any) {
  page.drawRectangle({
    x: MARGIN,
    y: MARGIN,
    width: CONTENT_WIDTH,
    height: PAGE_HEIGHT - 2 * MARGIN,
    borderColor: ORANGE,
    borderWidth: 1.5,
  })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.doctor_name) {
      return NextResponse.json({ error: 'Doctor name is required' }, { status: 400 })
    }

    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    drawOrangeBorder(page)

    let y = PAGE_HEIGHT - MARGIN

    // Header
    try {
      const logoPath = join(process.cwd(), 'public', 'ayurshala_text.png')
      const logoBuffer = readFileSync(logoPath)
      const logoImage = await pdfDoc.embedPng(logoBuffer)

      page.drawImage(logoImage, {
        x: PAGE_WIDTH / 2 - 35,
        y: y - 70,
        width: 70,
        height: 70,
      })
      y -= 100

      const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
      const clinicWidth = clinicText.length * 0.55 * 14
      page.drawText(clinicText, { x: PAGE_WIDTH / 2 - clinicWidth / 2, y, size: 14, color: BLACK })
      y -= 20

      addText(page, 'SP-28, Wajidpur, Sector-130, Noida – 201301', PAGE_WIDTH / 2 - 120, y, 10)
      y -= 15
      addText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', PAGE_WIDTH / 2 - 135, y, 9)
      y -= 25

      page.drawLine({ start: { x: MARGIN + 20, y }, end: { x: PAGE_WIDTH - MARGIN - 20, y }, thickness: 1, color: ORANGE })
      y -= 20

      const titleText = 'DISCHARGE SUMMARY'
      const titleWidth = titleText.length * 0.55 * 16
      page.drawText(titleText, { x: PAGE_WIDTH / 2 - titleWidth / 2, y, size: 16, color: ORANGE })
      y -= 30

      page.drawLine({ start: { x: MARGIN + 20, y }, end: { x: PAGE_WIDTH - MARGIN - 20, y }, thickness: 1, color: ORANGE })
      y -= 20
    } catch (e) {
      console.error('Header error:', e)
    }

    // Content
    const leftMargin = MARGIN + 20

    addText(page, `Patient UHID: ${data.patient_uhid || ''}`, leftMargin, y, 10)
    y -= 15
    addText(page, `Patient Name: ${data.patient_name || ''}`, leftMargin, y, 10)
    y -= 15
    addText(page, `Age: ${data.age || ''} Sex: ${data.sex || ''} Nationality: ${data.nationality || ''}`, leftMargin, y, 10)
    y -= 15
    addText(page, `DOA: ${data.doa_date || ''} ${data.doa_time || ''} | DOD: ${data.dod_date || ''} ${data.dod_time || ''}`, leftMargin, y, 10)
    y -= 20

    addText(page, `Diagnosis: ${data.diagnosis || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, 'Complaints on Admission:', leftMargin, y, 11)
    y -= 12
    data.complaints?.slice(0, 5).forEach((c: string, i: number) => {
      addText(page, `${i + 1}. ${c || ''}`, leftMargin + 20, y, 10)
      y -= 12
    })
    y -= 8

    addText(page, `History: ${data.history_present_complaints || ''} (${data.history_days || ''} days)`, leftMargin, y, 10)
    y -= 15

    addText(page, `Past History - Medical: ${data.past_history_medical || ''} Surgical: ${data.past_history_surgical || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Medication Administered: ${data.medication_administered || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Day of Therapy: ${data.day_of_therapy || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, 'Pradhan Vedna:', leftMargin, y, 11)
    y -= 12
    data.pradhan_vedna?.slice(0, 3).forEach((v: string, i: number) => {
      addText(page, `${i + 1}. ${v || ''}`, leftMargin + 20, y, 10)
      y -= 12
    })
    y -= 8

    addText(page, `Vitals: BP ${data.vitals_bp || ''} HR ${data.vitals_hr || ''} Nadi ${data.vitals_nadi || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, 'O/E:', leftMargin, y, 11)
    y -= 12
    addText(page, `Mala: ${data.oe_mala || ''} Mutra: ${data.oe_mutra || ''} Jihwa: ${data.oe_jihwa || ''}`, leftMargin + 20, y, 10)
    y -= 12
    addText(page, `Shuda: ${data.oe_shuda || ''} Nidra: ${data.oe_nidra || ''}`, leftMargin + 20, y, 10)
    y -= 15

    addText(page, 'Therapy/Procedures:', leftMargin, y, 11)
    y -= 12
    data.therapies?.slice(0, 3).forEach((t: string, i: number) => {
      addText(page, `${i + 1}. ${t || ''}`, leftMargin + 20, y, 10)
      y -= 12
    })
    y -= 8

    addText(page, `Investigations: ${data.investigations || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Findings: ${data.findings_discharge || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Condition at Discharge: ${data.condition_discharge || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Advice: ${data.advice_discharge || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Cautions: ${data.cautions || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Pathya: ${data.pathya || ''}`, leftMargin, y, 10)
    y -= 15

    addText(page, `Apathya: ${data.apathya || ''}`, leftMargin, y, 10)
    y -= 25

    addText(page, `Dr. ${data.doctor_name || ''}`, leftMargin, y, 11)
    y -= 12
    addText(page, 'Mobile: +91-9821224767', leftMargin, y, 10)
    y -= 12
    addText(page, 'Email: ayurshalapanchkarma@gmail.com', leftMargin, y, 10)

    // Page number
    page.drawText(`Page 1 of 1`, { x: PAGE_WIDTH / 2 - 20, y: MARGIN + 5, size: 9, color: GRAY })

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discharge_Summary_${data.patient_uhid || 'PATIENT'}.pdf"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('PDF error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
