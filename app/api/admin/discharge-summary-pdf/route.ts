import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { PDFLayoutEngine } from '@/lib/pdf-layout-engine'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SECTION_SPACING = 12

async function measureSectionHeight(text: string, fontSize: number = 10): Promise<number> {
  const charWidth = fontSize * 0.5
  const maxWidth = 515 - 40
  const words = text.split(' ')
  let lines = 1
  let currentLine = ''

  words.forEach(word => {
    const testLine = currentLine ? currentLine + ' ' + word : word
    if (testLine.length * charWidth <= maxWidth) {
      currentLine = testLine
    } else {
      lines++
      currentLine = word
    }
  })

  return lines * 14 + SECTION_SPACING
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.doctor_name) {
      return NextResponse.json({ error: 'Doctor name required' }, { status: 400 })
    }

    const pdfDoc = await PDFDocument.create()
    const engine = new PDFLayoutEngine(pdfDoc)

    // Load and embed logo
    const logoPath = join(process.cwd(), 'public', 'ayurshala_text.png')
    const logoBuffer = readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBuffer)

    await engine.init(logoImage)

    // BLOCK 1: Patient Information
    let height = 14
    await engine.ensureSpace(height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('PATIENT INFORMATION'))

    height = 14 * 4 + SECTION_SPACING
    await engine.ensureSpace(height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawLabel('Patient UHID:', data.patient_uhid || ''))
    engine.setCurrentY(engine.getCurrentY() - engine.drawLabel('Patient Name:', data.patient_name || ''))
    engine.setCurrentY(engine.getCurrentY() - engine.drawLabel('Age:', `${data.age || ''} / ${data.sex || ''}`))
    engine.setCurrentY(engine.getCurrentY() - engine.drawLabel('Nationality:', data.nationality || ''))

    // BLOCK 2: Diagnosis
    height = await measureSectionHeight(data.diagnosis || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('DIAGNOSIS'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.diagnosis || ''))

    // BLOCK 3: Complaints
    if (data.complaints && data.complaints.length > 0) {
      const complaintItems = data.complaints.slice(0, 10)
      let complaintHeight = 14 + complaintItems.length * 14 + SECTION_SPACING
      await engine.ensureSpace(complaintHeight)
      engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('COMPLAINTS ON ADMISSION'))
      engine.setCurrentY(engine.getCurrentY() - engine.drawNumberedList(complaintItems))
    }

    // BLOCK 4: History
    height = await measureSectionHeight(data.history_present_complaints || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('HISTORY OF PRESENT COMPLAINTS'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.history_present_complaints || ''))

    // BLOCK 5: Past History
    height = 14 + SECTION_SPACING
    await engine.ensureSpace(height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('PAST HISTORY'))
    engine.setCurrentY(
      engine.getCurrentY() -
        engine.drawLabel(
          'Medical/Surgical:',
          `${data.past_history_medical || ''} / ${data.past_history_surgical || ''}`
        )
    )

    // BLOCK 6: Medication Administered
    height = await measureSectionHeight(data.medication_administered || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('MEDICATION ADMINISTERED'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.medication_administered || ''))

    // BLOCK 7: Day of Therapy
    height = 14 + SECTION_SPACING
    await engine.ensureSpace(height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('DAY OF THERAPY'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawLabel('Days:', data.day_of_therapy || ''))

    // BLOCK 8: Pradhan Vedna
    if (data.pradhan_vedna && data.pradhan_vedna.length > 0) {
      const vednaItems = data.pradhan_vedna.slice(0, 10)
      let vednaHeight = 14 + vednaItems.length * 14 + SECTION_SPACING
      await engine.ensureSpace(vednaHeight)
      engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('PRADHAN VEDNA'))
      engine.setCurrentY(engine.getCurrentY() - engine.drawNumberedList(vednaItems))
    }

    // BLOCK 9: Vitals
    height = 14 + SECTION_SPACING
    await engine.ensureSpace(height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('VITALS ON ADMISSION'))
    engine.setCurrentY(
      engine.getCurrentY() - engine.drawLabel('BP/HR/Nadi:', `${data.vitals_bp || ''} / ${data.vitals_hr || ''} / ${data.vitals_nadi || ''}`)
    )

    // BLOCK 10: O/E
    height = 14 + 14 * 2 + SECTION_SPACING
    await engine.ensureSpace(height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('EXAMINATION (O/E)'))
    engine.setCurrentY(
      engine.getCurrentY() - engine.drawLabel('Mala/Mutra/Jihwa:', `${data.oe_mala || ''} / ${data.oe_mutra || ''} / ${data.oe_jihwa || ''}`)
    )
    engine.setCurrentY(
      engine.getCurrentY() - engine.drawLabel('Shuda/Nidra:', `${data.oe_shuda || ''} / ${data.oe_nidra || ''}`)
    )

    // BLOCK 11: Therapies
    if (data.therapies && data.therapies.length > 0) {
      const therapyItems = data.therapies.slice(0, 10)
      let therapyHeight = 14 + therapyItems.length * 14 + SECTION_SPACING
      await engine.ensureSpace(therapyHeight)
      engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('THERAPIES/PROCEDURES'))
      engine.setCurrentY(engine.getCurrentY() - engine.drawNumberedList(therapyItems))
    }

    // BLOCK 12: Investigations
    height = await measureSectionHeight(data.investigations || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('INVESTIGATIONS'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.investigations || ''))

    // BLOCK 13: Findings
    height = await measureSectionHeight(data.findings_discharge || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('FINDINGS ON DISCHARGE'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.findings_discharge || ''))

    // BLOCK 14: Condition at Discharge
    height = await measureSectionHeight(data.condition_discharge || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('CONDITION AT DISCHARGE'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.condition_discharge || ''))

    // BLOCK 15: Advice on Discharge
    height = await measureSectionHeight(data.advice_discharge || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('ADVICE ON DISCHARGE'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.advice_discharge || ''))

    // BLOCK 16: Medicine Table
    if (data.medicines && data.medicines.length > 0) {
      const headers = ['Medication', 'Dosage', 'Instructions', 'Schedule', 'Duration']
      const rows = data.medicines.map((m: any) => [m.name || '', m.dosage || '', m.instructions || '', m.schedule || '', m.duration || ''])
      const tableHeight = (rows.length + 1) * 18 + SECTION_SPACING

      await engine.ensureSpace(14 + tableHeight)
      engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('MEDICINES'))
      await engine.drawTable(headers, rows)
    }

    // BLOCK 17: Cautions
    height = await measureSectionHeight(data.cautions || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('CAUTIONS'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.cautions || ''))

    // BLOCK 18: Pathya
    height = await measureSectionHeight(data.pathya || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('PATHYA (RECOMMENDED)'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.pathya || ''))

    // BLOCK 19: Apathya
    height = await measureSectionHeight(data.apathya || '')
    await engine.ensureSpace(14 + height)
    engine.setCurrentY(engine.getCurrentY() - engine.drawHeading('APATHYA (CONTRAINDICATED)'))
    engine.setCurrentY(engine.getCurrentY() - engine.drawWrappedText(data.apathya || ''))

    // BLOCK 20: Signature Block (atomic - no split)
    const signatureBlockHeight = 14 * 3 + SECTION_SPACING
    await engine.ensureSpace(signatureBlockHeight + 20)
    engine.setCurrentY(engine.getCurrentY() - engine.drawSignatureBlock(data.doctor_name))

    const pdfBytes = await engine.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Discharge_Summary_${data.patient_uhid || 'PATIENT'}.pdf"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('PDF error:', message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
