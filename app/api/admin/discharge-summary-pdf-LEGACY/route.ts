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

    // ── COMPREHENSIVE PAYLOAD LOG ──
    console.log('=== PDF PAYLOAD (FULL) ===')
    console.dir(data, { depth: null, maxArrayLength: 50 })
    console.log('=== END PDF PAYLOAD ===')

    // ── Log all incoming fields with type checking ──
    console.log('[PDF] Field presence and types:')
    const fieldStatus = {
      patient_uhid: { value: data.patient_uhid, type: typeof data.patient_uhid, defined: data.patient_uhid !== undefined },
      patient_name: { value: data.patient_name, type: typeof data.patient_name, defined: data.patient_name !== undefined },
      age: { value: data.age, type: typeof data.age, defined: data.age !== undefined },
      sex: { value: data.sex, type: typeof data.sex, defined: data.sex !== undefined },
      diagnosis: { value: data.diagnosis, type: typeof data.diagnosis, defined: data.diagnosis !== undefined },
      complaints: { value: Array.isArray(data.complaints) ? `[${data.complaints.length}]` : data.complaints, type: typeof data.complaints, defined: data.complaints !== undefined },
      history_present_complaints: { value: data.history_present_complaints, type: typeof data.history_present_complaints, defined: data.history_present_complaints !== undefined },
      past_history_medical: { value: data.past_history_medical, type: typeof data.past_history_medical, defined: data.past_history_medical !== undefined },
      past_history_surgical: { value: data.past_history_surgical, type: typeof data.past_history_surgical, defined: data.past_history_surgical !== undefined },
      medication_administered: { value: data.medication_administered, type: typeof data.medication_administered, defined: data.medication_administered !== undefined },
      day_of_therapy: { value: data.day_of_therapy, type: typeof data.day_of_therapy, defined: data.day_of_therapy !== undefined },
      pradhan_vedna: { value: Array.isArray(data.pradhan_vedna) ? `[${data.pradhan_vedna.length}]` : data.pradhan_vedna, type: typeof data.pradhan_vedna, defined: data.pradhan_vedna !== undefined },
      vitals_bp: { value: data.vitals_bp, type: typeof data.vitals_bp, defined: data.vitals_bp !== undefined },
      vitals_hr: { value: data.vitals_hr, type: typeof data.vitals_hr, defined: data.vitals_hr !== undefined },
      vitals_nadi: { value: data.vitals_nadi, type: typeof data.vitals_nadi, defined: data.vitals_nadi !== undefined },
      oe_mala: { value: data.oe_mala, type: typeof data.oe_mala, defined: data.oe_mala !== undefined },
      oe_mutra: { value: data.oe_mutra, type: typeof data.oe_mutra, defined: data.oe_mutra !== undefined },
      oe_jihwa: { value: data.oe_jihwa, type: typeof data.oe_jihwa, defined: data.oe_jihwa !== undefined },
      oe_shuda: { value: data.oe_shuda, type: typeof data.oe_shuda, defined: data.oe_shuda !== undefined },
      oe_nidra: { value: data.oe_nidra, type: typeof data.oe_nidra, defined: data.oe_nidra !== undefined },
      therapies: { value: Array.isArray(data.therapies) ? `[${data.therapies.length}]` : data.therapies, type: typeof data.therapies, defined: data.therapies !== undefined },
      investigations: { value: data.investigations, type: typeof data.investigations, defined: data.investigations !== undefined },
      findings_discharge: { value: data.findings_discharge, type: typeof data.findings_discharge, defined: data.findings_discharge !== undefined },
      condition_discharge: { value: data.condition_discharge, type: typeof data.condition_discharge, defined: data.condition_discharge !== undefined },
      advice_discharge: { value: data.advice_discharge, type: typeof data.advice_discharge, defined: data.advice_discharge !== undefined },
      medicines: { value: Array.isArray(data.medicines) ? `[${data.medicines.length}]` : data.medicines, type: typeof data.medicines, defined: data.medicines !== undefined },
      cautions: { value: data.cautions, type: typeof data.cautions, defined: data.cautions !== undefined },
      pathya: { value: data.pathya, type: typeof data.pathya, defined: data.pathya !== undefined },
      apathya: { value: data.apathya, type: typeof data.apathya, defined: data.apathya !== undefined },
      doctor_name: { value: data.doctor_name, type: typeof data.doctor_name, defined: data.doctor_name !== undefined },
    }
    console.log(JSON.stringify(fieldStatus, null, 2))

    // Report any undefined fields
    const undefinedFields = Object.entries(fieldStatus)
      .filter(([_, info]) => !info.defined)
      .map(([field]) => field)
    
    if (undefinedFields.length > 0) {
      console.error('[PDF] ⚠️ UNDEFINED FIELDS:', undefinedFields)
    }

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

    console.log('[PDF] Starting document block generation...')

    try {
      // Build document blocks
      doc.addBlock(new Heading('PATIENT INFORMATION'))
      console.log('[PDF-BLOCK] Added: PATIENT INFORMATION')
      
      doc.addBlock(new LabelValue('Patient UHID:', sanitize(data.patient_uhid || '')))
      console.log('[PDF-BLOCK] Added: Patient UHID')
      
      doc.addBlock(new LabelValue('Patient Name:', sanitize(data.patient_name || '')))
      console.log('[PDF-BLOCK] Added: Patient Name')
      
      doc.addBlock(new LabelValue('Age / Sex:', `${data.age || ''} / ${data.sex || ''}`))
      console.log('[PDF-BLOCK] Added: Age / Sex')
      
      doc.addBlock(new LabelValue('Nationality:', sanitize(data.nationality || '')))
      console.log('[PDF-BLOCK] Added: Nationality')
      
      doc.addBlock(new Spacer(12))

      if (data.diagnosis) {
        doc.addBlock(new Heading('DIAGNOSIS'))
        console.log('[PDF-BLOCK] Added: DIAGNOSIS heading')
        doc.addBlock(new Paragraph(sanitize(data.diagnosis)))
        console.log('[PDF-BLOCK] Added: DIAGNOSIS content')
        doc.addBlock(new Spacer(12))
      }

      if (data.complaints && data.complaints.length > 0) {
        doc.addBlock(new Heading('COMPLAINTS ON ADMISSION'))
        console.log('[PDF-BLOCK] Added: COMPLAINTS heading')
        doc.addBlock(new NumberedList(data.complaints.map((c: string) => sanitize(c))))
        console.log('[PDF-BLOCK] Added: COMPLAINTS list')
        doc.addBlock(new Spacer(12))
      }

      if (data.history_present_complaints) {
        doc.addBlock(new Heading('HISTORY OF PRESENT COMPLAINTS'))
        console.log('[PDF-BLOCK] Added: HISTORY heading')
        doc.addBlock(new Paragraph(sanitize(data.history_present_complaints)))
        console.log('[PDF-BLOCK] Added: HISTORY content')
        doc.addBlock(new Spacer(12))
      }

      if (data.past_history_medical || data.past_history_surgical) {
        doc.addBlock(new Heading('PAST HISTORY'))
        console.log('[PDF-BLOCK] Added: PAST HISTORY heading')
        doc.addBlock(new LabelValue('Medical / Surgical:', `${sanitize(data.past_history_medical || '')} / ${sanitize(data.past_history_surgical || '')}`))
        console.log('[PDF-BLOCK] Added: PAST HISTORY content')
        doc.addBlock(new Spacer(12))
      }

      if (data.medication_administered) {
        doc.addBlock(new Heading('MEDICATION ADMINISTERED'))
        console.log('[PDF-BLOCK] Added: MEDICATION heading')
        doc.addBlock(new Paragraph(sanitize(data.medication_administered)))
        console.log('[PDF-BLOCK] Added: MEDICATION content')
        doc.addBlock(new Spacer(12))
      }

      if (data.day_of_therapy) {
        doc.addBlock(new Heading('DAY OF THERAPY'))
        console.log('[PDF-BLOCK] Added: DAY OF THERAPY heading')
        doc.addBlock(new LabelValue('Days:', sanitize(data.day_of_therapy)))
        console.log('[PDF-BLOCK] Added: DAY OF THERAPY content')
        doc.addBlock(new Spacer(12))
      }

      if (data.pradhan_vedna && data.pradhan_vedna.length > 0) {
        doc.addBlock(new Heading('PRADHAN VEDNA'))
        console.log('[PDF-BLOCK] Added: PRADHAN VEDNA heading')
        doc.addBlock(new NumberedList(data.pradhan_vedna.map((v: string) => sanitize(v))))
        console.log('[PDF-BLOCK] Added: PRADHAN VEDNA list')
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

    console.log('[PDF] All blocks added successfully. Starting render...')

    try {
      await doc.render()
      console.log('[PDF] Render completed successfully')
    } catch (renderError) {
      console.error('[PDF-RENDER-ERROR] Failed to render document:', renderError instanceof Error ? renderError.message : String(renderError))
      throw renderError
    }

    try {
      const pdfBytes = await doc.save()
      console.log('[PDF] PDF saved successfully, size:', pdfBytes.length, 'bytes')

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Discharge_Summary_${data.patient_uhid || 'PATIENT'}.pdf"`,
        },
      })
    } catch (saveError) {
      console.error('[PDF-SAVE-ERROR] Failed to save PDF:', saveError instanceof Error ? saveError.message : String(saveError))
      throw saveError
    }

    } catch (blockError) {
      console.error('[PDF-BLOCK-ERROR]', blockError instanceof Error ? blockError.message : String(blockError))
      throw blockError
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''
    console.error('[PDF-OUTER-ERROR] Exception:', message)
    console.error('[PDF-OUTER-ERROR] Stack:', stack)
    return NextResponse.json({ error: message, stack: stack }, { status: 500 })
  }
}
