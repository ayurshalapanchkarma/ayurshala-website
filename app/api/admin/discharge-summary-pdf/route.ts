import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { FlowDocument, Heading, LabelValue, Paragraph, NumberedList, MedicineTable, SignatureBlock, Spacer } from '@/lib/flow-document'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sanitize(text: string): string {
  if (!text) return ''
  return text.replace(/₂/g, '2').replace(/₃/g, '3').replace(/SpO₂/g, 'SpO2').replace(/CO₂/g, 'CO2').replace(/O₂/g, 'O2')
}

export async function POST(req: NextRequest) {
  const RENDERER_VERSION = 'dd82a1b'
  const BUILD_TIME = '2026-06-29T00:49:00Z'
  
  try {
    const data = await req.json()

    if (!data.doctor_name) {
      return NextResponse.json({ error: 'Doctor name required' }, { status: 400 })
    }

    console.log(`[PDF] Version: ${RENDERER_VERSION} | Built: ${BUILD_TIME}`)

    const pdfDoc = await PDFDocument.create()
    const doc = new FlowDocument(pdfDoc)

    const logoPath = join(process.cwd(), 'public', 'ayurshala_text.png')
    const logoBuffer = readFileSync(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBuffer)

    await doc.init(logoImage)

    // Build document blocks
    doc.addBlock(new Heading('PATIENT INFORMATION'))
    doc.addBlock(new LabelValue('Patient UHID:', sanitize(data.patient_uhid || '')))
    doc.addBlock(new LabelValue('Patient Name:', sanitize(data.patient_name || '')))
    doc.addBlock(new LabelValue('Age / Sex:', `${data.age || ''} / ${data.sex || ''}`))
    doc.addBlock(new LabelValue('Nationality:', sanitize(data.nationality || '')))
    doc.addBlock(new Spacer(12))

    if (data.diagnosis) {
      doc.addBlock(new Heading('DIAGNOSIS'))
      doc.addBlock(new Paragraph(sanitize(data.diagnosis)))
      doc.addBlock(new Spacer(12))
    }

    if (data.complaints && data.complaints.length > 0) {
      doc.addBlock(new Heading('COMPLAINTS ON ADMISSION'))
      doc.addBlock(new NumberedList(data.complaints.map((c: string) => sanitize(c))))
      doc.addBlock(new Spacer(12))
    }

    if (data.history_present_complaints) {
      doc.addBlock(new Heading('HISTORY OF PRESENT COMPLAINTS'))
      doc.addBlock(new Paragraph(sanitize(data.history_present_complaints)))
      doc.addBlock(new Spacer(12))
    }

    if (data.past_history_medical || data.past_history_surgical) {
      doc.addBlock(new Heading('PAST HISTORY'))
      doc.addBlock(new LabelValue('Medical / Surgical:', `${sanitize(data.past_history_medical || '')} / ${sanitize(data.past_history_surgical || '')}`))
      doc.addBlock(new Spacer(12))
    }

    if (data.medication_administered) {
      doc.addBlock(new Heading('MEDICATION ADMINISTERED'))
      doc.addBlock(new Paragraph(sanitize(data.medication_administered)))
      doc.addBlock(new Spacer(12))
    }

    if (data.day_of_therapy) {
      doc.addBlock(new Heading('DAY OF THERAPY'))
      doc.addBlock(new LabelValue('Days:', sanitize(data.day_of_therapy)))
      doc.addBlock(new Spacer(12))
    }

    if (data.pradhan_vedna && data.pradhan_vedna.length > 0) {
      doc.addBlock(new Heading('PRADHAN VEDNA'))
      doc.addBlock(new NumberedList(data.pradhan_vedna.map((v: string) => sanitize(v))))
      doc.addBlock(new Spacer(12))
    }

    if (data.vitals_bp || data.vitals_hr) {
      doc.addBlock(new Heading('VITALS ON ADMISSION'))
      doc.addBlock(new LabelValue('BP / HR / Nadi:', `${sanitize(data.vitals_bp || '')} / ${sanitize(data.vitals_hr || '')} / ${sanitize(data.vitals_nadi || '')}`))
      doc.addBlock(new Spacer(12))
    }

    if (data.oe_mala || data.oe_mutra) {
      doc.addBlock(new Heading('EXAMINATION (O/E)'))
      doc.addBlock(new LabelValue('Mala / Mutra / Jihwa:', `${sanitize(data.oe_mala || '')} / ${sanitize(data.oe_mutra || '')} / ${sanitize(data.oe_jihwa || '')}`))
      doc.addBlock(new LabelValue('Shuda / Nidra:', `${sanitize(data.oe_shuda || '')} / ${sanitize(data.oe_nidra || '')}`))
      doc.addBlock(new Spacer(12))
    }

    if (data.therapies && data.therapies.length > 0) {
      doc.addBlock(new Heading('THERAPIES / PROCEDURES'))
      doc.addBlock(new NumberedList(data.therapies.map((t: string) => sanitize(t))))
      doc.addBlock(new Spacer(12))
    }

    if (data.investigations) {
      doc.addBlock(new Heading('INVESTIGATIONS'))
      doc.addBlock(new Paragraph(sanitize(data.investigations)))
      doc.addBlock(new Spacer(12))
    }

    if (data.findings_discharge) {
      doc.addBlock(new Heading('FINDINGS ON DISCHARGE'))
      doc.addBlock(new Paragraph(sanitize(data.findings_discharge)))
      doc.addBlock(new Spacer(12))
    }

    if (data.condition_discharge) {
      doc.addBlock(new Heading('CONDITION AT DISCHARGE'))
      doc.addBlock(new Paragraph(sanitize(data.condition_discharge)))
      doc.addBlock(new Spacer(12))
    }

    if (data.advice_discharge) {
      doc.addBlock(new Heading('ADVICE ON DISCHARGE'))
      doc.addBlock(new Paragraph(sanitize(data.advice_discharge)))
      doc.addBlock(new Spacer(12))
    }

    if (data.medicines && data.medicines.length > 0) {
      doc.addBlock(new Heading('MEDICINES'))
      doc.addBlock(new MedicineTable(data.medicines.map((m: any) => ({
        name: sanitize(m.name || ''),
        dosage: sanitize(m.dosage || ''),
        instructions: sanitize(m.instructions || ''),
        schedule: sanitize(m.schedule || ''),
        duration: sanitize(m.duration || ''),
      }))))
      doc.addBlock(new Spacer(12))
    }

    if (data.cautions) {
      doc.addBlock(new Heading('CAUTIONS'))
      doc.addBlock(new Paragraph(sanitize(data.cautions)))
      doc.addBlock(new Spacer(12))
    }

    if (data.pathya) {
      doc.addBlock(new Heading('PATHYA (RECOMMENDED)'))
      doc.addBlock(new Paragraph(sanitize(data.pathya)))
      doc.addBlock(new Spacer(12))
    }

    if (data.apathya) {
      doc.addBlock(new Heading('APATHYA (CONTRAINDICATED)'))
      doc.addBlock(new Paragraph(sanitize(data.apathya)))
      doc.addBlock(new Spacer(12))
    }

    doc.addBlock(new Spacer(20))
    doc.addBlock(new SignatureBlock(sanitize(data.doctor_name)))

    await doc.render()
    const pdfBytes = await doc.save()

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
