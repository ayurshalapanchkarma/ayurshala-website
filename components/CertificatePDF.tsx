import { Document, Page, Text } from '@react-pdf/renderer'

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
  return (
    <Document>
      <Page size="A4">
        <Text>PDF TEST</Text>
      </Page>
    </Document>
  )
}
