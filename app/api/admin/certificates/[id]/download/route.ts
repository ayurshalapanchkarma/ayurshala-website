import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificatePDF'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params
    console.log(`[PDF] Fetching certificate: ${certificateId}`)

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(
        `
        *,
        patient:patient_uuid(full_name, patient_id),
        certificate_type:certificate_type_id(name)
      `
      )
      .eq('id', certificateId)
      .single()

    if (error || !certificate) {
      console.error(`[PDF] Certificate not found: ${error?.message || 'unknown'}`)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (certificate.status !== 'ISSUED') {
      console.error(`[PDF] Certificate not issued: ${certificate.status}`)
      return NextResponse.json({ error: 'Certificate not issued' }, { status: 403 })
    }

    console.log(`[PDF] Generating PDF for certificate: ${certificate.certificate_no}`)

    // Read logo and convert to base64
    const logoPath = path.join(process.cwd(), 'public', 'ayurshala.png')
    const logoBuffer = fs.readFileSync(logoPath)
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

    const buffer = await renderToBuffer(
      CertificatePDF({ certificate, logoUrl: logoBase64 })
    )

    console.log(`[PDF] PDF generated successfully, size: ${buffer.length} bytes`)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificate-${certificate.certificate_no}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[PDF] Generation error:', error)
    return NextResponse.json(
      { error: 'PDF generation failed', details: String(error) },
      { status: 500 }
    )
  }
}
