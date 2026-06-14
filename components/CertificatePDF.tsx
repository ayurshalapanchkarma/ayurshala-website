import { Document, Page, Text, Image, View, StyleSheet } from '@react-pdf/renderer'
import { getNarrativeText } from './CertificateTemplates'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
  },
})

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

export const CertificatePDF = ({
  certificate,
  logoUrl,
}: {
  certificate: CertificateData
  logoUrl: string
}) => {
  const narrative = getNarrativeText(certificate.certificate_type.name, certificate as any)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image
          src={logoUrl}
          style={{
            width: 70,
            height: 70,
            alignSelf: 'center',
            marginBottom: 10,
          }}
        />
        <Text>{String(certificate.patient.full_name)}</Text>
        <Text>{String(certificate.certificate_no)}</Text>
        <Text>{String(narrative)}</Text>

        <View style={styles.signatureSection}>
          <Text>Patient Signature</Text>
          <Text>{`Dr. ${certificate.issued_by}`}</Text>
          <Text>Ayurshala Panchakarma Center</Text>
        </View>
      </Page>
    </Document>
  )
}
