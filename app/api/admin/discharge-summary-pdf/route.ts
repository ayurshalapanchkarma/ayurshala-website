import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function addText(page: any, text: string, x: number, y: number, size: number = 10, bold: boolean = false) {
  page.drawText(text, { x, y, size })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595, 842])

    let y = 800
    const leftMargin = 40
    const lineHeight = 12

    // Add header with logo
    try {
      const logoPath = join(process.cwd(), 'public', 'ayurshala_text.png')
      const logoBuffer = readFileSync(logoPath)
      const logoImage = await pdfDoc.embedPng(logoBuffer)
      const logoDims = logoImage.scale(0.3)
      page.drawImage(logoImage, { x: 245, y: y - 35, width: logoDims.width, height: logoDims.height })
      y -= 50
    } catch (e) {
      console.error('Logo error:', e)
    }

    // Clinic header
    addText(page, 'AYURSHALA PANCHAKARMA CENTER', 150, y, 12, true)
    y -= 15
    addText(page, 'SP-28, Wajidpur, Sector-130, Noida – 201301', 155, y, 10)
    y -= 12
    addText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', 155, y, 10)
    y -= 15

    // Divider
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0, 0, 0) })
    y -= 15

    // Title
    addText(page, 'DISCHARGE SUMMARY', 200, y, 14, true)
    y -= 25

    // Patient UHID
    addText(page, `Patient UHID- ${data.patient_uhid || '_______________'}`, leftMargin, y, 10)
    y -= 15

    // Patient Name
    addText(page, `Patient Name- Mr/Ms ${data.patient_name || '_______________'}`, leftMargin, y, 10)
    y -= 15

    // Age/Sex
    addText(page, `Age/Sex- ${data.age || '____'} y/ ${data.sex || '____'}`, leftMargin, y, 10)
    y -= 15

    // DOA/DOD
    addText(page, `DOA- ${data.doa_date || '__/__/____'}, Time- ${data.doa_time || '____'} AM/PM`, leftMargin, y, 10)
    y -= 12
    addText(page, `DOD- ${data.dod_date || '__/__/____'}, Time- ${data.dod_time || '____'} AM/PM`, leftMargin, y, 10)
    y -= 15

    // Nationality
    addText(page, `Nationality- ${data.nationality || '_______________'}`, leftMargin, y, 10)
    y -= 12

    // Address
    addText(page, `Address- ${data.address || '_______________'}`, leftMargin, y, 10)
    y -= 20

    // Diagnosis
    addText(page, 'Diagnosis-', leftMargin, y, 10, true)
    addText(page, data.diagnosis || '_____________________________________', leftMargin + 70, y, 10)
    y -= 15

    // Complaints
    addText(page, 'Complaints on Admission-', leftMargin, y, 10, true)
    y -= 12
    data.complaints?.slice(0, 5).forEach((c: string, i: number) => {
      addText(page, `${i + 1}. ${c || '_____________________________'}`, leftMargin + 20, y, 10)
      y -= 12
    })
    y -= 5

    // History
    addText(page, `History of present complaints- ${data.history_present_complaints || '_____________'} Days`, leftMargin, y, 10)
    y -= 15

    // Past History
    addText(page, `Past History- Medical ${data.past_history_medical}/Surgical ${data.past_history_surgical}`, leftMargin, y, 10)
    if (data.past_history_details) {
      y -= 12
      addText(page, `Details: ${data.past_history_details}`, leftMargin + 20, y, 10)
    }
    y -= 15

    // Medication Administered
    addText(page, `Medication Administered- ${data.medication_administered || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Day of Therapy
    addText(page, `Day of therapy- ${data.day_of_therapy || '____'}`, leftMargin, y, 10)
    y -= 15

    // Pradhan Vedna
    addText(page, 'Pradhan Vedna-', leftMargin, y, 10, true)
    y -= 12
    data.pradhan_vedna?.slice(0, 3).forEach((v: string, i: number) => {
      addText(page, `${i + 1}. ${v || '_____________________________'}`, leftMargin + 20, y, 10)
      y -= 12
    })
    y -= 5

    // Vitals
    addText(page, `Vitals on admission- BP- ${data.vitals_bp || '___/__'} mmHg, HR- ${data.vitals_hr || '____'}/min, Nadi- ${data.vitals_nadi || '________'}`, leftMargin, y, 10)
    y -= 15

    // O/E
    addText(page, 'O/E-', leftMargin, y, 10, true)
    y -= 12
    const oeFields = ['Mala', 'Mutra', 'Jihwa', 'Shuda', 'Nidra']
    oeFields.forEach(field => {
      const key = `oe_${field.toLowerCase()}`
      addText(page, `${field}- ${data[key] || '_____________'}`, leftMargin + 20, y, 10)
      y -= 11
    })
    y -= 5

    // Therapy/Procedures
    addText(page, 'Therapy/Procedures-', leftMargin, y, 10, true)
    y -= 12
    data.therapies?.slice(0, 5).forEach((t: string, i: number) => {
      addText(page, `${i + 1}. ${t || '_____________________________'}`, leftMargin + 20, y, 10)
      y -= 11
    })
    y -= 5

    // Investigations
    addText(page, `Investigations- ${data.investigations || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Findings on Discharge
    addText(page, `Findings on Discharge- ${data.findings_discharge || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Condition at Discharge
    addText(page, `Condition at time of Discharge- ${data.condition_discharge || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Advice on Discharge
    addText(page, `Advices on Discharge- ${data.advice_discharge || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Medicine on Discharge
    addText(page, `Medicine on Discharge- ${data.medicine_discharge || '_____________________________'}`, leftMargin, y, 10)
    y -= 20

    // Cautions
    addText(page, `Cautions- ${data.cautions || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Pathya
    addText(page, `Pathya- ${data.pathya || '_____________________________'}`, leftMargin, y, 10)
    y -= 15

    // Apathya
    addText(page, `Apathya- ${data.apathya || '_____________________________'}`, leftMargin, y, 10)
    y -= 25

    // Doctor
    addText(page, `Dr. ${data.doctor_name || '_____________________________'}`, leftMargin, y, 10, true)
    y -= 12
    addText(page, `Mobile: +91-9821224767`, leftMargin, y, 10)
    y -= 12
    addText(page, `Email: ayurshalapanchkarma@gmail.com`, leftMargin, y, 10)

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discharge_Summary_${data.patient_uhid || 'PATIENT'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
