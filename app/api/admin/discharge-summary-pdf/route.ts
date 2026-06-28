import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { PDFLayoutEngine } from '@/lib/pdf-layout-engine'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SPACING_AFTER_SECTION = 12

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.doctor_name) {
      return NextResponse.json({ error: 'Doctor name required' }, { status: 400 })
    }

    const pdfDoc = await PDFDocument.create()
    const engine = new PDFLayoutEngine(pdfDoc)

    // Load logo
    const logoPath = join(process.cwd(), 'public', 'ayurshala_text.png')
    const logoBuffer = readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBuffer)

    await engine.init(logoImage)

    // Helper to render a block
    async function renderBlock(title: string, contentRenderer: () => Promise<number>) {
      const titleHeight = engine.drawHeading(title)
      await engine.ensureSpace(titleHeight + SPACING_AFTER_SECTION)
      engine.setCurrentY(engine.getCurrentY() - titleHeight)

      const contentHeight = await contentRenderer()

      await engine.ensureSpace(contentHeight + SPACING_AFTER_SECTION)
      engine.setCurrentY(engine.getCurrentY() - contentHeight - SPACING_AFTER_SECTION)
    }

    // BLOCK: Patient Information Header
    await renderBlock('PATIENT INFORMATION', async () => {
      let blockHeight = 0

      const uhidHeight = engine.drawLabel('Patient UHID:', data.patient_uhid || '')
      blockHeight += uhidHeight
      engine.setCurrentY(engine.getCurrentY() - uhidHeight)

      const nameHeight = engine.drawLabel('Patient Name:', data.patient_name || '')
      blockHeight += nameHeight
      engine.setCurrentY(engine.getCurrentY() - nameHeight)

      const ageHeight = engine.drawLabel('Age / Sex:', `${data.age || ''} / ${data.sex || ''}`)
      blockHeight += ageHeight
      engine.setCurrentY(engine.getCurrentY() - ageHeight)

      const natHeight = engine.drawLabel('Nationality:', data.nationality || '')
      blockHeight += natHeight
      engine.setCurrentY(engine.getCurrentY() - natHeight)

      return blockHeight
    })

    // BLOCK: Diagnosis
    if (data.diagnosis) {
      const diagHeight = engine.measureWrappedHeight(data.diagnosis)
      await engine.ensureSpace(14 + diagHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('DIAGNOSIS')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.diagnosis)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Complaints
    if (data.complaints && data.complaints.length > 0) {
      const listHeight = engine.measureListHeight(data.complaints)
      await engine.ensureSpace(14 + listHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('COMPLAINTS ON ADMISSION')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawNumberedList(data.complaints)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: History
    if (data.history_present_complaints) {
      const histHeight = engine.measureWrappedHeight(data.history_present_complaints)
      await engine.ensureSpace(14 + histHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('HISTORY OF PRESENT COMPLAINTS')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.history_present_complaints)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Past History
    if (data.past_history_medical || data.past_history_surgical) {
      await engine.ensureSpace(14 + 14 + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('PAST HISTORY')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawLabel(
        'Medical / Surgical:',
        `${data.past_history_medical || ''} / ${data.past_history_surgical || ''}`
      )
      engine.setCurrentY(engine.getCurrentY() - contentHeight - SPACING_AFTER_SECTION)
    }

    // BLOCK: Medication Administered
    if (data.medication_administered) {
      const medHeight = engine.measureWrappedHeight(data.medication_administered)
      await engine.ensureSpace(14 + medHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('MEDICATION ADMINISTERED')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.medication_administered)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Day of Therapy
    if (data.day_of_therapy) {
      await engine.ensureSpace(14 + 14 + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('DAY OF THERAPY')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawLabel('Days:', data.day_of_therapy)
      engine.setCurrentY(engine.getCurrentY() - contentHeight - SPACING_AFTER_SECTION)
    }

    // BLOCK: Pradhan Vedna
    if (data.pradhan_vedna && data.pradhan_vedna.length > 0) {
      const vednaHeight = engine.measureListHeight(data.pradhan_vedna)
      await engine.ensureSpace(14 + vednaHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('PRADHAN VEDNA')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawNumberedList(data.pradhan_vedna)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Vitals
    if (data.vitals_bp || data.vitals_hr) {
      await engine.ensureSpace(14 + 14 + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('VITALS ON ADMISSION')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawLabel('BP / HR / Nadi:', `${data.vitals_bp || ''} / ${data.vitals_hr || ''} / ${data.vitals_nadi || ''}`)
      engine.setCurrentY(engine.getCurrentY() - contentHeight - SPACING_AFTER_SECTION)
    }

    // BLOCK: O/E
    if (data.oe_mala || data.oe_mutra) {
      await engine.ensureSpace(14 + 14 * 2 + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('EXAMINATION (O/E)')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)

      let oeHeight = 0
      const oe1 = engine.drawLabel('Mala / Mutra / Jihwa:', `${data.oe_mala || ''} / ${data.oe_mutra || ''} / ${data.oe_jihwa || ''}`)
      oeHeight += oe1
      engine.setCurrentY(engine.getCurrentY() - oe1)

      const oe2 = engine.drawLabel('Shuda / Nidra:', `${data.oe_shuda || ''} / ${data.oe_nidra || ''}`)
      oeHeight += oe2
      engine.setCurrentY(engine.getCurrentY() - oe2 - SPACING_AFTER_SECTION)
    }

    // BLOCK: Therapies
    if (data.therapies && data.therapies.length > 0) {
      const therapyHeight = engine.measureListHeight(data.therapies)
      await engine.ensureSpace(14 + therapyHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('THERAPIES / PROCEDURES')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawNumberedList(data.therapies)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Investigations
    if (data.investigations) {
      const invHeight = engine.measureWrappedHeight(data.investigations)
      await engine.ensureSpace(14 + invHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('INVESTIGATIONS')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.investigations)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Findings
    if (data.findings_discharge) {
      const findHeight = engine.measureWrappedHeight(data.findings_discharge)
      await engine.ensureSpace(14 + findHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('FINDINGS ON DISCHARGE')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.findings_discharge)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Condition at Discharge
    if (data.condition_discharge) {
      const condHeight = engine.measureWrappedHeight(data.condition_discharge)
      await engine.ensureSpace(14 + condHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('CONDITION AT DISCHARGE')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.condition_discharge)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Advice on Discharge
    if (data.advice_discharge) {
      const advHeight = engine.measureWrappedHeight(data.advice_discharge)
      await engine.ensureSpace(14 + advHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('ADVICE ON DISCHARGE')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.advice_discharge)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Medicine Table
    if (data.medicines && data.medicines.length > 0) {
      const headers = ['Medication', 'Dosage', 'Instructions', 'Schedule', 'Duration']
      const rows = data.medicines.map((m: any) => [m.name || '', m.dosage || '', m.instructions || '', m.schedule || '', m.duration || ''])

      const tableHeight = engine.measureTableHeight(rows)
      await engine.ensureSpace(14 + tableHeight + SPACING_AFTER_SECTION)

      const titleHeight = engine.drawHeading('MEDICINES')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)

      const contentHeight = await engine.drawTable(headers, rows)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Cautions
    if (data.cautions) {
      const cautHeight = engine.measureWrappedHeight(data.cautions)
      await engine.ensureSpace(14 + cautHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('CAUTIONS')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.cautions)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Pathya
    if (data.pathya) {
      const pathHeight = engine.measureWrappedHeight(data.pathya)
      await engine.ensureSpace(14 + pathHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('PATHYA (RECOMMENDED)')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.pathya)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Apathya
    if (data.apathya) {
      const apathHeight = engine.measureWrappedHeight(data.apathya)
      await engine.ensureSpace(14 + apathHeight + SPACING_AFTER_SECTION)
      const titleHeight = engine.drawHeading('APATHYA (CONTRAINDICATED)')
      engine.setCurrentY(engine.getCurrentY() - titleHeight)
      const contentHeight = engine.drawWrappedText(data.apathya)
      engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)
    }

    // BLOCK: Signature Block (atomic)
    const sigHeight = engine.measureSignatureHeight()
    await engine.ensureSpace(sigHeight + 20)
    const sigContentHeight = engine.drawSignatureBlock(data.doctor_name)
    engine.setCurrentY(engine.getCurrentY() - SPACING_AFTER_SECTION)

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
