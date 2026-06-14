import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { CertificatePDF } from '@/components/CertificatePDF'
import fs from 'fs'
import path from 'path'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params
    console.log(`[PDF] Fetching certificate: ${certificateId}`)

    const { data: cert, error } = await supabase
      .from('certificates')
      .select(
        `
        id,
        certificate_no,
        patient:patient_uuid(full_name, patient_id),
        certificate_type:certificate_type_id(name),
        issue_date,
        issued_by,
        valid_from,
        valid_to,
        purpose,
        diagnosis,
        treatment_details,
        recommendations,
        restrictions,
        additional_notes,
        status
      `
      )
      .eq('id', certificateId)
      .single()

    const certificate = cert as any
    if (error || !certificate) {
      console.error(`[PDF] Certificate not found: ${error?.message || 'unknown'}`)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (certificate.status !== 'ISSUED') {
      console.error(`[PDF] Certificate not issued: ${certificate.status}`)
      return NextResponse.json({ error: 'Certificate not issued' }, { status: 403 })
    }

    console.log(`[PDF] Generating PDF for certificate: ${certificate.certificate_no}`)

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala.png')
    console.log('Logo path:', logoPath)
    console.log('Logo exists:', fs.existsSync(logoPath))

    let logoBase64 = ''
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
      console.log('Logo loaded successfully')
    } else {
      console.warn('[PDF] Logo not found, generating PDF without logo')
    }

    console.log(`[PDF] Rendering PDF document with certificate type: ${certificate.certificate_type.name}`)
    const pdfBuffer = await renderToBuffer(
      <CertificatePDF
        certificate={certificate as any}
        logoUrl={logoBase64}
      />
    )

    console.log(`[PDF] PDF generated successfully: ${pdfBuffer.length} bytes`)
    console.log('PDF bytes:', pdfBuffer.length)

    const response = new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_no}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

    console.log(`[PDF] Response ready for download`)
    return response
  } catch (error) {
    console.error('[PDF] Generation error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
