import { renderToBuffer } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificatePDF'

export async function generateCertificatePDF(certificate: any, logoUrl: string) {
  return renderToBuffer(
    <CertificatePDF certificate={certificate} logoUrl={logoUrl} />
  )
}
