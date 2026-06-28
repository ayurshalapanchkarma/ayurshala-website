import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, PDFPage } from 'pdf-lib'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DischargeSummaryData {
  patient_uhid: string
  patient_name: string
  age: string
  sex: string
  doa_date: string
  doa_time: string
  dod_date: string
  dod_time: string
  nationality: string
  address: string
  diagnosis: string
  complaints: string[]
  history_present_days: string
  past_history: string
  past_history_details: string
  medications_administered: string[]
  day_of_therapy: string
  pradhan_vedna: string[]
  vitals_admission_bp: string
  vitals_admission_hr: string
  vitals_admission_nadi: string
  oe_mala: string
  oe_mutra: string
  oe_jihwa: string
  oe_shuda: string
  oe_nidra: string
  therapies: string[]
  investigations: string
  findings_discharge: string
  condition_discharge: string
  advice_discharge: string
  medicine_discharge: string
  medications_table: Array<{ name: string; instruction: string; schedule: string }>
  cautions: string
  pathya: string
  apathya: string
  doctor_name: string
  doctor_mobile: string
  clinic_email: string
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, thickness: number = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness })
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number = 10, bold: boolean = false) {
  page.drawText(text, {
    x,
    y,
    size,
    font: bold ? undefined : undefined,
  })
}

export async function POST(req: NextRequest) {
  try {
    const data: DischargeSummaryData = await req.json()
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595, 842])

    let y = 800
    const leftMargin = 40
    const lineHeight = 12
    const maxWidth = 515

    // Title
    drawText(page, 'Discharge Summary - Day Care', leftMargin, y, 12, true)
    y -= 25

    // Header line 1
    drawText(page, `Patient UHID-………………. ${data.patient_uhid}`, leftMargin, y, 10)
    drawText(page, `Age/Sex- ${data.age} y/`, leftMargin + 350, y, 10)
    y -= 15

    // Header line 2
    drawText(page, `Patient Name- Mr/Ms ${data.patient_name}`, leftMargin, y, 10)
    drawText(page, data.sex, leftMargin + 380, y, 10)
    y -= 20

    // Header line 3 - DOA/DOD
    drawText(page, `Day care -DOA-  ${data.doa_date}, Time-${data.doa_time} AM/PM`, leftMargin, y, 10)
    drawText(page, `DOD- ${data.dod_date}, Time- ${data.dod_time} AM/PM`, leftMargin + 350, y, 10)
    y -= 20

    // Nationality & Address
    drawText(page, `Nationality- ${data.nationality}`, leftMargin, y, 10)
    y -= lineHeight
    drawText(page, `Address- ${data.address}`, leftMargin, y, 10)
    y -= 20

    // Diagnosis
    drawText(page, `Diagnosis-`, leftMargin, y, 10, true)
    drawText(page, data.diagnosis, leftMargin + 70, y, 10)
    y -= lineHeight

    // Complaints on Admission
    drawText(page, `Complaints on Admission-`, leftMargin, y, 10, true)
    y -= lineHeight
    data.complaints.forEach((complaint, idx) => {
      drawText(page, `${idx + 1}. ${complaint}`, leftMargin + 20, y, 10)
      y -= lineHeight
    })
    y -= 5

    // History of present complaints
    drawText(page, `History of present complaints- …………… Days`, leftMargin, y, 10)
    y -= lineHeight

    // Past History
    drawText(page, `Past History-   Medical/ Surgical:  No/yes-`, leftMargin, y, 10)
    y -= lineHeight
    if (data.past_history_details) {
      drawText(page, `if yes… ${data.past_history_details}`, leftMargin + 20, y, 10)
      y -= lineHeight
    }
    y -= 5

    // Medication Administered
    drawText(page, `Medication Administered- ${data.medications_administered.join('/')}`, leftMargin, y, 10)
    y -= lineHeight

    // Day of therapy
    drawText(page, `Day -  of therapy- ${data.day_of_therapy}`, leftMargin, y, 10)
    y -= lineHeight

    // Pradhan Vedna
    drawText(page, `Pradhan Vedna-`, leftMargin, y, 10, true)
    y -= lineHeight
    data.pradhan_vedna.forEach((vedna, idx) => {
      drawText(page, `${idx + 1}. ${vedna}`, leftMargin + 20, y, 10)
      y -= lineHeight
    })
    y -= 5

    // Vitals on admission
    drawText(page, `Vitals on admission- Bp- ${data.vitals_admission_bp} mmHg, HR-${data.vitals_admission_hr}/min, Nadi- ${data.vitals_admission_nadi}`, leftMargin, y, 10)
    y -= lineHeight

    // O/E
    drawText(page, `O/E-`, leftMargin, y, 10, true)
    y -= lineHeight
    drawText(page, `Mala- ${data.oe_mala}/Asamyak/Samyak`, leftMargin + 20, y, 10)
    y -= lineHeight
    drawText(page, `Mutra-${data.oe_mutra}/Asamyak/Samyak`, leftMargin + 20, y, 10)
    y -= lineHeight
    drawText(page, `Jihwa- ${data.oe_jihwa}/Asamyak/Samyak`, leftMargin + 20, y, 10)
    y -= lineHeight
    drawText(page, `Shuda- ${data.oe_shuda}/Asamyak/Samyak`, leftMargin + 20, y, 10)
    y -= lineHeight
    drawText(page, `Nidra- ${data.oe_nidra}/Asamyak/Samyak`, leftMargin + 20, y, 10)
    y -= 15

    // Therapy / Procedures
    drawText(page, `Therapy/ Procedures-`, leftMargin, y, 10, true)
    y -= lineHeight
    data.therapies.forEach((therapy, idx) => {
      drawText(page, `${idx + 1}.\t${therapy}`, leftMargin + 20, y, 10)
      y -= lineHeight
    })
    y -= 5

    // Investigations
    drawText(page, `Investigations –   ${data.investigations}`, leftMargin, y, 10)
    y -= lineHeight

    // Findings on Discharge
    drawText(page, `Findings on Discharge – ${data.findings_discharge}`, leftMargin, y, 10)
    y -= lineHeight

    // Conditions at Discharge
    drawText(page, `Conditions at the time of Discharge- ${data.condition_discharge}`, leftMargin, y, 10)
    y -= lineHeight

    // Advices on Discharge
    drawText(page, `Advices on Discharge- ${data.advice_discharge}`, leftMargin, y, 10)
    y -= lineHeight

    // Medicine on Discharge
    drawText(page, `Medicine on Discharge- ${data.medicine_discharge}`, leftMargin, y, 10)
    y -= 20

    // Medication Table Header
    drawText(page, `Medication Name`, leftMargin, y, 9, true)
    drawText(page, `Instruction to Patient`, leftMargin + 200, y, 9, true)
    drawText(page, `Schedule Time`, leftMargin + 400, y, 9, true)
    y -= 12
    drawLine(page, leftMargin, y, leftMargin + maxWidth, y, 1)
    y -= 12

    // Medication Table Rows
    data.medications_table.forEach((med) => {
      drawText(page, med.name, leftMargin, y, 9)
      drawText(page, med.instruction, leftMargin + 200, y, 9)
      drawText(page, med.schedule, leftMargin + 400, y, 9)
      y -= lineHeight
    })
    y -= 10

    // Cautions
    drawText(page, `Cautions- ${data.cautions}`, leftMargin, y, 10)
    y -= lineHeight

    // Pathya
    drawText(page, `Pathya- ${data.pathya}`, leftMargin, y, 10)
    y -= lineHeight

    // Apathya
    drawText(page, `Apathya- ${data.apathya}`, leftMargin, y, 10)
    y -= 30

    // Footer
    drawText(page, `Dr. ${data.doctor_name}`, leftMargin, y, 10, true)
    y -= lineHeight
    drawText(page, `${data.doctor_mobile}`, leftMargin, y, 10)
    y -= lineHeight
    drawText(page, `In case of emergency or increase of symptoms please contact`, leftMargin, y, 9)
    y -= lineHeight
    drawText(page, `Email- ${data.clinic_email}`, leftMargin, y, 9)

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="discharge-${data.patient_uhid}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Discharge PDF error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
