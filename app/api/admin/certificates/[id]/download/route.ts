import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
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

    // Get certificate type name
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
    const logoUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`

    const React = await import('react')
    const { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } =
      await import('@react-pdf/renderer')

    const styles = StyleSheet.create({
      page: { padding: 0, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
      borderPage: { margin: '12mm', border: '2px solid #F97316', padding: '15mm', flexDirection: 'column' },
      logo: { width: '70px', height: '70px', marginHorizontal: 'auto', marginTop: '5mm', marginBottom: '8mm' },
      header: { textAlign: 'center', marginBottom: '15mm' },
      headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: '4px', color: '#111827' },
      headerText: { fontSize: 10, color: '#111827', marginBottom: '1px', lineHeight: 1.4 },
      headerContact: { fontSize: 9, color: '#6B7280', marginTop: '3px' },
      certTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#F97316', textAlign: 'center', textTransform: 'uppercase', marginBottom: '15mm', marginTop: '5mm' },
      body: { fontSize: 11, lineHeight: 1.8, color: '#111827', textAlign: 'justify', marginBottom: 10 },
      signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, marginBottom: 8, paddingHorizontal: '10mm' },
      signatureBlock: { width: '40%', textAlign: 'center' },
      signatureLine: { borderTopWidth: 1, borderTopColor: '#111827', paddingTop: 3, marginTop: 20, fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' },
      signatureSub: { fontSize: 9, marginTop: '2px', fontFamily: 'Helvetica', color: '#111827' },
      footer: { textAlign: 'center', fontSize: 8, color: '#6B7280', marginTop: 15, lineHeight: 1.5 },
    })

    const narrative = getNarrative(certType.name, certificate)

    const e = (type: any, props: any, ...children: any[]) =>
      React.createElement(type, props, ...children.filter((c: any) => c != null))

    const doc = e(Document, {},
      e(Page, { size: 'A4', style: styles.page },
        e(View, { style: styles.borderPage },
          e(Image, { style: styles.logo, src: logoUrl }),
          e(View, { style: styles.header },
            e(Text, { style: styles.headerTitle }, 'AYURSHALA PANCHAKARMA CENTER'),
            e(Text, { style: styles.headerText }, 'SP-28, Wajidpur,'),
            e(Text, { style: styles.headerText }, 'Sector-130, Noida – 201301'),
            e(Text, { style: styles.headerContact }, '+91-9821224767'),
            e(Text, { style: styles.headerContact }, 'ayurshalapanchkarma@gmail.com')
          ),
          e(Text, { style: styles.certTitle }, String(certType.name)),
          e(Text, { style: styles.body }, narrative),
          e(View, { style: styles.signatureSection },
            e(View, { style: styles.signatureBlock },
              e(View, { style: styles.signatureLine },
                e(Text, {}, 'Patient Signature')
              )
            ),
            e(View, { style: styles.signatureBlock },
              e(View, { style: styles.signatureLine },
                e(Text, {}, 'Dr. ' + String(certificate.issued_by)),
                e(Text, { style: styles.signatureSub }, 'Ayurshala Panchakarma Center')
              )
            )
          ),
          e(View, { style: styles.footer },
            e(Text, {}, 'This certificate has been electronically generated by Ayurshala Panchakarma Center.'),
            e(Text, {}, 'No physical signature is required.')
          )
        )
      )
    ) as any

    const buffer = await renderToBuffer(doc)

    return new NextResponse(buffer as any, {
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
