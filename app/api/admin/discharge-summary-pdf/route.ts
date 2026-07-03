import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { FlowDocument, Heading, LabelValue, Paragraph, NumberedList, MedicineTable, SignatureBlock, Spacer } from '@/lib/flow-document'
import { globalTracer, EnvironmentInfo } from '@/lib/trace-logger'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sanitize(text: string): string {
  if (!text) return ''
  return text.replace(/₂/g, '2').replace(/₃/g, '3').replace(/SpO₂/g, 'SpO2').replace(/CO₂/g, 'CO2').replace(/O₂/g, 'O2')
}

export async function POST(req: NextRequest) {
  const RENDERER_VERSION = '55ad57c'
  const COMMIT_HASH = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || '55ad57c'
  const BUILD_TIME = process.env.VERCEL_BUILD_TIME || new Date().toISOString()
  const ENVIRONMENT = process.env.VERCEL_ENV || 'local'
  
  try {
    const data = await req.json()

    // ── Startup log — appears at the top of every production PDF request ──
    console.log('[PDF] Request received', {
      version: RENDERER_VERSION,
      commit: COMMIT_HASH,
      build: BUILD_TIME,
      environment: ENVIRONMENT,
      node: process.version,
      booking_id: data.booking_uuid || data.booking_id || 'unknown',
      patient_uhid: data.patient_uhid || 'unknown',
    })

    // ── Log all incoming fields to identify undefined values ──
    console.log('[PDF] Input fields:', {
      patient_uhid: { value: data.patient_uhid, type: typeof data.patient_uhid },
      patient_name: { value: data.patient_name, type: typeof data.patient_name },
      age: { value: data.age, type: typeof data.age },
      sex: { value: data.sex, type: typeof data.sex },
      diagnosis: { value: data.diagnosis, type: typeof data.diagnosis },
      complaints: { value: Array.isArray(data.complaints) ? `[${data.complaints.length} items]` : data.complaints, type: typeof data.complaints },
      history_present_complaints: { value: data.history_present_complaints, type: typeof data.history_present_complaints },
      past_history_medical: { value: data.past_history_medical, type: typeof data.past_history_medical },
      past_history_surgical: { value: data.past_history_surgical, type: typeof data.past_history_surgical },
      medication_administered: { value: data.medication_administered, type: typeof data.medication_administered },
      day_of_therapy: { value: data.day_of_therapy, type: typeof data.day_of_therapy },
      pradhan_vedna: { value: Array.isArray(data.pradhan_vedna) ? `[${data.pradhan_vedna.length} items]` : data.pradhan_vedna, type: typeof data.pradhan_vedna },
      vitals_bp: { value: data.vitals_bp, type: typeof data.vitals_bp },
      vitals_hr: { value: data.vitals_hr, type: typeof data.vitals_hr },
      vitals_nadi: { value: data.vitals_nadi, type: typeof data.vitals_nadi },
      oe_mala: { value: data.oe_mala, type: typeof data.oe_mala },
      oe_mutra: { value: data.oe_mutra, type: typeof data.oe_mutra },
      oe_jihwa: { value: data.oe_jihwa, type: typeof data.oe_jihwa },
      oe_shuda: { value: data.oe_shuda, type: typeof data.oe_shuda },
      oe_nidra: { value: data.oe_nidra, type: typeof data.oe_nidra },
      therapies: { value: Array.isArray(data.therapies) ? `[${data.therapies.length} items]` : data.therapies, type: typeof data.therapies },
      investigations: { value: data.investigations, type: typeof data.investigations },
      findings_discharge: { value: data.findings_discharge, type: typeof data.findings_discharge },
      condition_discharge: { value: data.condition_discharge, type: typeof data.condition_discharge },
      advice_discharge: { value: data.advice_discharge, type: typeof data.advice_discharge },
      medicines: { value: Array.isArray(data.medicines) ? `[${data.medicines.length} items]` : data.medicines, type: typeof data.medicines },
      cautions: { value: data.cautions, type: typeof data.cautions },
      pathya: { value: data.pathya, type: typeof data.pathya },
      apathya: { value: data.apathya, type: typeof data.apathya },
      doctor_name: { value: data.doctor_name, type: typeof data.doctor_name },
    })

    if (!data.doctor_name) {
      return NextResponse.json({ error: 'Doctor name required' }, { status: 400 })
    }

    // Set up environment info for tracing
    const envInfo: EnvironmentInfo = {
      renderVersion: RENDERER_VERSION,
      commitHash: COMMIT_HASH,
      buildTime: BUILD_TIME,
      environment: ENVIRONMENT,
      nodeVersion: process.version,
      pdfLibVersion: '1.16.0',
      fontLoaded: true,
      fontName: 'Helvetica'
    }
    globalTracer.setEnvironment(envInfo)

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
      console.log(`[ADVICE] Type: ${typeof data.advice_discharge}, IsArray: ${Array.isArray(data.advice_discharge)}`)
      if (Array.isArray(data.advice_discharge)) {
        console.log(`[ADVICE] Items: ${data.advice_discharge.length}`)
        doc.addBlock(new NumberedList(data.advice_discharge.map((a: any) => sanitize(typeof a === 'string' ? a : JSON.stringify(a)))))
      } else {
        console.log(`[ADVICE] Content length: ${data.advice_discharge.length}`)
        doc.addBlock(new Paragraph(sanitize(data.advice_discharge)))
      }
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
      console.log(`[CAUTIONS] Type: ${typeof data.cautions}, IsArray: ${Array.isArray(data.cautions)}`)
      if (Array.isArray(data.cautions)) {
        console.log(`[CAUTIONS] Items: ${data.cautions.length}`)
        doc.addBlock(new NumberedList(data.cautions.map((c: any) => sanitize(typeof c === 'string' ? c : JSON.stringify(c)))))
      } else {
        console.log(`[CAUTIONS] Content length: ${data.cautions.length}`)
        doc.addBlock(new Paragraph(sanitize(data.cautions)))
      }
      doc.addBlock(new Spacer(12))
    }

    if (data.pathya) {
      doc.addBlock(new Heading('PATHYA (RECOMMENDED)'))
      console.log(`[PATHYA] Type: ${typeof data.pathya}, IsArray: ${Array.isArray(data.pathya)}`)
      if (Array.isArray(data.pathya)) {
        console.log(`[PATHYA] Items: ${data.pathya.length}`)
        doc.addBlock(new NumberedList(data.pathya.map((p: any) => sanitize(typeof p === 'string' ? p : JSON.stringify(p)))))
      } else {
        console.log(`[PATHYA] Content length: ${data.pathya.length}`)
        doc.addBlock(new Paragraph(sanitize(data.pathya)))
      }
      doc.addBlock(new Spacer(12))
    }

    if (data.apathya) {
      doc.addBlock(new Heading('APATHYA (CONTRAINDICATED)'))
      console.log(`[APATHYA] Type: ${typeof data.apathya}, IsArray: ${Array.isArray(data.apathya)}`)
      if (Array.isArray(data.apathya)) {
        console.log(`[APATHYA] Items: ${data.apathya.length}`)
        doc.addBlock(new NumberedList(data.apathya.map((a: any) => sanitize(typeof a === 'string' ? a : JSON.stringify(a)))))
      } else {
        console.log(`[APATHYA] Content length: ${data.apathya.length}`)
        doc.addBlock(new Paragraph(sanitize(data.apathya)))
      }
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
