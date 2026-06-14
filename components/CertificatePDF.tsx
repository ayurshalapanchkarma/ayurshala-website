import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a472a',
  },
  headerText: {
    fontSize: 11,
    color: '#333',
    marginBottom: 2,
  },
  certTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 25,
    letterSpacing: 1,
  },
  certDetails: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 11,
  },
  detailRow: {
    marginBottom: 6,
  },
  content: {
    width: '100%',
    marginBottom: 20,
  },
  section: {
    marginBottom: 12,
    pageBreakInside: 'avoid',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 6,
    color: '#333',
  },
  sectionContent: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.4,
    marginLeft: 10,
  },
  patientInfo: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    gap: 20,
  },
  infoBlock: {
    flex: 1,
    fontSize: 10,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: '#333',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#999',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 8,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
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
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <Image style={styles.logo} src={logoUrl} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>AYURSHALA PANCHAKARMA CENTER</Text>
            <Text style={styles.headerText}>SP-28, Wajidpur, Sector-130, Noida – 201301</Text>
            <Text style={styles.headerText}>+91-9821224767</Text>
            <Text style={styles.headerText}>ayurshalapanchkarma@gmail.com</Text>
          </View>

          <Text style={styles.certTitle}>{certificate.certificate_type.name}</Text>

          <View style={styles.certDetails}>
            <View style={styles.detailRow}>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Certificate No: </Text>
                {certificate.certificate_no}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Date Issued: </Text>
                {formatDate(certificate.issue_date)}
              </Text>
            </View>
          </View>

          <View style={styles.patientInfo}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>PATIENT NAME</Text>
              <Text style={styles.infoValue}>{certificate.patient.full_name}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>PATIENT ID</Text>
              <Text style={styles.infoValue}>{certificate.patient.patient_id}</Text>
            </View>
          </View>

          <View style={styles.content}>
            {(certificate.valid_from || certificate.valid_to) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>VALIDITY</Text>
                <Text style={styles.sectionContent}>
                  {certificate.valid_from && `Valid From: ${formatDate(certificate.valid_from)}`}
                  {certificate.valid_from && certificate.valid_to && '\n'}
                  {certificate.valid_to && `Valid To: ${formatDate(certificate.valid_to)}`}
                </Text>
              </View>
            )}

            {certificate.purpose && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PURPOSE</Text>
                <Text style={styles.sectionContent}>{certificate.purpose}</Text>
              </View>
            )}

            {certificate.diagnosis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DIAGNOSIS</Text>
                <Text style={styles.sectionContent}>{certificate.diagnosis}</Text>
              </View>
            )}

            {certificate.treatment_details && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TREATMENT DETAILS</Text>
                <Text style={styles.sectionContent}>{certificate.treatment_details}</Text>
              </View>
            )}

            {certificate.recommendations && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>RECOMMENDATIONS</Text>
                <Text style={styles.sectionContent}>{certificate.recommendations}</Text>
              </View>
            )}

            {certificate.restrictions && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>RESTRICTIONS</Text>
                <Text style={styles.sectionContent}>{certificate.restrictions}</Text>
              </View>
            )}

            {certificate.additional_notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ADDITIONAL NOTES</Text>
                <Text style={styles.sectionContent}>{certificate.additional_notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              <Text style={{ fontWeight: 'bold' }}>Issued By: </Text>
              {certificate.issued_by}
            </Text>
            <Text style={styles.disclaimer}>
              This certificate has been electronically generated by Ayurshala Panchakarma Center.
            </Text>
            <Text style={styles.disclaimer}>No physical signature is required.</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
