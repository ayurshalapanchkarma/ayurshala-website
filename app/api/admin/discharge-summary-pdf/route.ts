import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, PDFPage } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

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
  history_present: string
  past_history: string
  medications_administered: string[]
  day_of_therapy: string
  pradhan_vedna: string[]
  vitals_admission: string
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
  doctor_phone: string
  clinic_email: string
}

export async function POST(req: NextRequest) {
  try {
    const data: DischargeSummaryData = await req.json()

    const pdfDoc = await PDFDocument.create()
    
    // Page 1
    let page = pdfDoc.addPage([612, 792])
    let yPosition = 750

    // Helper to add text
    const addText = (text: string, size: number = 11, isBold: boolean = false, yOffset: number = 15) => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([612, 792])
        yPosition = 750
      }
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: size,
      })
      yPosition -= yOffset
      return yPosition
    }

    const addLine = (label: string, value: string, yOffset: number = 15) => {
      addText(`${label} ${value}`, 10, false, yOffset)
    }

    // Header
    addText('Discharge Summary - Day Care', 12, true, 20)
    yPosition -= 10

    addLine(`Patient UHID - `, data.patient_uhid)
    addLine(`Patient Name - `, `Mr/Ms ${data.patient_name}`)
    addLine(`Age/Sex - `, `${data.age} y/ ${data.sex}`)
    
    addText(`Day care - DOA - ${data.doa_date}, Time - ${data.doa_time}`, 10, false, 12)
    addText(`DOD - ${data.dod_date}, Time - ${data.dod_time}`, 10, false, 12)
    
    yPosition -= 5
    addLine(`Nationality - `, data.nationality)
    addLine(`Address - `, data.address)
    
    yPosition -= 5
    addText(`Diagnosis - ${data.diagnosis}`, 10, false, 12)
    
    addText('Complaints on Admission -', 10, true, 12)
    data.complaints.forEach((complaint, idx) => {
      addText(`${idx + 1}. ${complaint}`, 10, false, 12)
    })
    
    addText(`History of present complaints - ${data.history_present}`, 10, false, 12)
    addText(`Past History - Medical/Surgical: ${data.past_history}`, 10, false, 12)
    
    addText('Medication Administered -', 10, true, 12)
    data.medications_administered.forEach(med => {
      addText(`• ${med}`, 10, false, 12)
    })
    
    addText(`Day of therapy - ${data.day_of_therapy}`, 10, false, 12)
    
    addText('Pradhan Vedna -', 10, true, 12)
    data.pradhan_vedna.forEach((vedna, idx) => {
      addText(`${idx + 1}. ${vedna}`, 10, false, 12)
    })
    
    addText(`Vitals on admission - ${data.vitals_admission}`, 10, false, 12)
    
    addText('O/E -', 10, true, 12)
    addText(`Mala - ${data.oe_mala}`, 10, false, 12)
    addText(`Mutra - ${data.oe_mutra}`, 10, false, 12)
    addText(`Jihwa - ${data.oe_jihwa}`, 10, false, 12)
    addText(`Shuda - ${data.oe_shuda}`, 10, false, 12)
    addText(`Nidra - ${data.oe_nidra}`, 10, false, 12)
    
    addText('Therapy / Procedures -', 10, true, 12)
    data.therapies.forEach((therapy, idx) => {
      addText(`${idx + 1}. ${therapy}`, 10, false, 12)
    })
    
    addText(`Investigations - ${data.investigations}`, 10, false, 12)
    addText(`Findings on Discharge - ${data.findings_discharge}`, 10, false, 12)
    addText(`Conditions at the time of Discharge - ${data.condition_discharge}`, 10, false, 12)
    addText(`Advices on Discharge - ${data.advice_discharge}`, 10, false, 12)
    addText(`Medicine on Discharge - ${data.medicine_discharge}`, 10, false, 12)
    
    // Medications table
    addText('Medication Name | Instruction to Patient | Schedule Time', 10, true, 15)
    data.medications_table.forEach(med => {
      addText(`${med.name} | ${med.instruction} | ${med.schedule}`, 9, false, 12)
    })
    
    addText(`Cautions - ${data.cautions}`, 10, false, 12)
    addText(`Pathya - ${data.pathya}`, 10, false, 12)
    addText(`Apathya - ${data.apathya}`, 10, false, 12)
    
    // Footer
    yPosition = 80
    page.drawText(`Dr. ${data.doctor_name}`, { x: 50, y: yPosition, size: 10 })
    page.drawText(data.doctor_phone, { x: 50, y: yPosition - 15, size: 10 })
    page.drawText('In case of emergency or increase of symptoms please contact', { x: 50, y: yPosition - 30, size: 9 })
    page.drawText(`Email - ${data.clinic_email}`, { x: 50, y: yPosition - 45, size: 9 })

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
