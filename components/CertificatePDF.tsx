import { Document, Page, Text, View, Image, StyleSheet, Line } from '@react-pdf/renderer'
import { getNarrativeText } from './CertificateTemplates'

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  container: {
    padding: '15mm',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  border: {
    position: 'absolute',
    border: '2px solid #F97316',
    left: '12mm',
    top: '12mm',
    right: '12mm',
    bottom: '12mm',
    width: 'calc(100% - 24mm)',
    height: 'calc(100% - 24mm)',
    pointerEvents: 'none',
  },
  cornerTL: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    left: '12mm',
    top: '12mm',
    borderLeft: '3px solid #F97316',
    borderTop: '3px solid #F97316',
  },
  cornerBR: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    right: '12mm',
    bottom: '12mm',
    borderRight: '3px solid #F97316',
    borderBottom: '3px solid #F97316',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    width: '70px',
    height: '70px',
    marginTop: '10mm',
    marginBottom: '8mm',
  },
  header: {
    textAlign: 'center',
    marginBottom: '15mm',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#F97316',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: '18mm',
    marginTop: '5mm',
  },
  body: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#111827',
    textAlign: 'justify',
    marginBottom: '20mm',
  },
  signatureSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8mm',
    marginTop: 'auto',
    width: '100%',
    paddingHorizontal: '20mm',
  },
  signatureBlock: {
    width: '35%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #111827',
    paddingTop: '3px',
    marginTop: '12mm',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    textAlign: 'center',
    fontSize: 8,
    color: '#6B7280',
    marginBottom: '10mm',
    lineHeight: 1.5,
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
        {/* Corner ornaments */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerBR} />

        {/* Main content */}
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Logo */}
            <Image style={styles.logo} src={logoUrl} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>AYURSHALA PANCHAKARMA CENTER</Text>
              <Text style={styles.headerText}>SP-28, Wajidpur,</Text>
              <Text style={styles.headerText}>Sector-130, Noida – 201301</Text>
              <Text style={styles.headerContact}>+91-9821224767</Text>
              <Text style={styles.headerContact}>ayurshalapanchkarma@gmail.com</Text>
            </View>

            {/* Certificate Title */}
            <Text style={styles.certTitle}>{certificate.certificate_type.name}</Text>

            {/* Certificate Body */}
            <Text style={styles.body}>{narrative}</Text>

            {/* Signature Section */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine}>
                  <Text>Patient Signature</Text>
                </View>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine}>
                  <Text>{`Dr. ${certificate.issued_by}`}</Text>
                  <Text style={{ fontSize: 9, marginTop: '2px' }}>
                    Ayurshala Panchakarma Center
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>
              This certificate has been electronically generated by Ayurshala Panchakarma Center.
            </Text>
            <Text>No physical signature is required.</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
