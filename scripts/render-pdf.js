// Runs outside Next.js bundle via child_process.spawn.
// Reads { certificate, logoUrl } JSON from stdin, writes PDF bytes to stdout.
const { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } =
  require('@react-pdf/renderer')
const React = require('react')

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  borderPage: {
    margin: '12mm',
    border: '2px solid #F97316',
    padding: '15mm',
    flexDirection: 'column',
  },
  logo: {
    width: '70px',
    height: '70px',
    marginHorizontal: 'auto',
    marginTop: '5mm',
    marginBottom: '8mm',
  },
  header: {
    textAlign: 'center',
    marginBottom: '15mm',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: '4px',
    color: '#111827',
  },
  headerText: {
    fontSize: 10,
    color: '#111827',
    marginBottom: '1px',
    lineHeight: 1.4,
  },
  headerContact: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: '3px',
  },
  certTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#F97316',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: '15mm',
    marginTop: '5mm',
  },
  body: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#111827',
    textAlign: 'justify',
    marginBottom: 10,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 8,
    paddingHorizontal: '10mm',
  },
  signatureBlock: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    paddingTop: 3,
    marginTop: 20,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  signatureSub: {
    fontSize: 9,
    marginTop: '2px',
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  footer: {
    textAlign: 'center',
    fontSize: 8,
    color: '#6B7280',
    marginTop: 15,
    lineHeight: 1.5,
  },
})

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-IN') } catch { return String(d) }
}

function getNarrative(certType, cert) {
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

function e(type, props, ...children) {
  return React.createElement(type, props, ...children.filter(c => c != null))
}

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const { certificate, logoUrl } = JSON.parse(Buffer.concat(chunks).toString())

  const narrative = getNarrative(String(certificate.certificate_type.name), certificate)

  const doc = e(Document, {},
    e(Page, { size: 'A4', style: styles.page },
      e(View, { style: styles.borderPage },
        // Logo — square 1:1, 70×70
        e(Image, { style: styles.logo, src: logoUrl }),

        // Header
        e(View, { style: styles.header },
          e(Text, { style: styles.headerTitle }, 'AYURSHALA PANCHAKARMA CENTER'),
          e(Text, { style: styles.headerText }, 'SP-28, Wajidpur,'),
          e(Text, { style: styles.headerText }, 'Sector-130, Noida – 201301'),
          e(Text, { style: styles.headerContact }, '+91-9821224767'),
          e(Text, { style: styles.headerContact }, 'ayurshalapanchkarma@gmail.com')
        ),

        // Certificate title
        e(Text, { style: styles.certTitle }, String(certificate.certificate_type.name)),

        // Narrative body
        e(Text, { style: styles.body }, narrative),

        // Signature section
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

        // Footer
        e(View, { style: styles.footer },
          e(Text, {}, 'This certificate has been electronically generated by Ayurshala Panchakarma Center.'),
          e(Text, {}, 'No physical signature is required.')
        )
      )
    )
  )

  const buffer = await renderToBuffer(doc)
  process.stdout.write(buffer)
}

main().catch(err => { process.stderr.write(err.message); process.exit(1) })
