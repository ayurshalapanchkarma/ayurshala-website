import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

interface CertificateData {
  certificate_no: string
  certificate_type: { name: string }
  patient: { full_name: string; patient_id: string }
  issue_date: string
  issued_by: string
  valid_from?: string
  valid_to?: string
  purpose?: string
  diagnosis?: string
  treatment_details?: string
  recommendations?: string
  restrictions?: string
  additional_notes?: string
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  border: {
    borderWidth: 3,
    borderColor: '#F97316',
    padding: 30,
    flex: 1,
  },
  logo: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#F97316',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 140,
    color: '#374151',
  },
  value: {
    fontSize: 10,
    flex: 1,
    color: '#111827',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 12,
  },
  narrativeLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 4,
  },
  narrative: {
    fontSize: 10,
    color: '#111827',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  signatureSection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    width: 160,
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
    width: 160,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

function getNarrative(type: string, cert: CertificateData): string {
  const name = String(cert.patient.full_name)
  const from = cert.valid_from ? String(cert.valid_from) : ''
  const to = cert.valid_to ? String(cert.valid_to) : ''
  const purpose = cert.purpose ? String(cert.purpose) : ''
  const diagnosis = cert.diagnosis ? String(cert.diagnosis) : ''
  const treatment = cert.treatment_details ? String(cert.treatment_details) : ''
  const recommendations = cert.recommendations ? String(cert.recommendations) : ''

  switch (type) {
    case 'Sick Leave Certificate':
      return `This is to certify that ${name} has been under our medical care and is advised to take rest from ${from} to ${to} due to medical reasons.`
    case 'Medical Fitness Certificate':
      return `This is to certify that ${name} has been examined and found medically fit${purpose ? ' for ' + purpose : ''}.`
    case 'Consultation Certificate':
      return `This is to certify that ${name} attended a medical consultation at our clinic${diagnosis ? '. Diagnosis: ' + diagnosis : ''}.`
    case 'Panchakarma Certificate':
      return `This is to certify that ${name} has successfully completed a Panchakarma treatment programme from ${from} to ${to}${treatment ? '. Treatment: ' + treatment : ''}.`
    case 'Treatment Certificate':
      return `This is to certify that ${name} has undergone treatment at our clinic from ${from} to ${to}${treatment ? '. Details: ' + treatment : ''}${recommendations ? '. Recommendations: ' + recommendations : ''}.`
    case 'Discharge Summary Certificate':
      return `This is to certify that ${name} was under treatment from ${from} to ${to} and has been discharged in stable condition${recommendations ? '. Follow-up: ' + recommendations : ''}.`
    default:
      return `This is to certify that ${name} has received medical services at Ayurshala Panchakarma Centre.`
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const CertificatePDF = ({
  certificate,
  logoUrl,
}: {
  certificate: CertificateData
  logoUrl: string
}) => {
  const narrative = getNarrative(String(certificate.certificate_type.name), certificate)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          {/* Logo */}
          <Image style={styles.logo} src={logoUrl} />

          {/* Title */}
          <Text style={styles.title}>{String(certificate.certificate_type.name)}</Text>

          {/* Patient details */}
          <View style={styles.row}>
            <Text style={styles.label}>Certificate No:</Text>
            <Text style={styles.value}>{String(certificate.certificate_no)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Patient Name:</Text>
            <Text style={styles.value}>{String(certificate.patient.full_name)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Patient ID:</Text>
            <Text style={styles.value}>{String(certificate.patient.patient_id)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{formatDate(String(certificate.issue_date))}</Text>
          </View>
          {certificate.valid_from && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid From:</Text>
              <Text style={styles.value}>{formatDate(String(certificate.valid_from))}</Text>
            </View>
          )}
          {certificate.valid_to && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid To:</Text>
              <Text style={styles.value}>{formatDate(String(certificate.valid_to))}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Narrative */}
          <Text style={styles.narrativeLabel}>Certificate Details</Text>
          <Text style={styles.narrative}>{narrative}</Text>

          {certificate.additional_notes ? (
            <>
              <Text style={styles.narrativeLabel}>Additional Notes</Text>
              <Text style={styles.narrative}>{String(certificate.additional_notes)}</Text>
            </>
          ) : null}

          {/* Signature */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>{String(certificate.issued_by)}</Text>
            <Text style={styles.signatureText}>Authorised Signatory</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ayurshala Panchakarma Centre — This certificate is computer generated and valid without physical signature.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
