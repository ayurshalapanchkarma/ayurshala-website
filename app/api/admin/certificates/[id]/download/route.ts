import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { CertificatePDF } from '@/components/CertificatePDF'
import { generateCertificatePDF } from '@/lib/certificates/generatePDF'
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
    console.log('[PDF] Start')
    console.log('[PDF] Certificate ID:', certificateId)

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
      console.error('[PDF] Certificate query failed:', error?.message || 'not found')
      return NextResponse.json({ error: error?.message || 'Certificate not found' }, { status: 404 })
    }

    console.log('[PDF] Certificate query success')
    console.log('[PDF] Status:', certificate.status)

    if (certificate.status !== 'ISSUED') {
      console.error(`[PDF] Certificate not issued: ${certificate.status}`)
      return NextResponse.json({ error: 'Certificate not issued' }, { status: 403 })
    }

    console.log(`[PDF] Generating PDF for certificate: ${certificate.certificate_no}`)

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    console.log('[PDF] Logo path:', logoPath)
    console.log('[PDF] Logo exists:', fs.existsSync(logoPath))

    if (!fs.existsSync(logoPath)) {
      console.error('[PDF] Logo missing at', logoPath)
      return NextResponse.json({ error: 'Logo missing' }, { status: 500 })
    }

    let logoBase64 = ''
    try {
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
      console.log('[PDF] Logo loaded successfully')
    } catch (logoError) {
      console.error('[PDF] Logo read failed:', logoError instanceof Error ? logoError.message : logoError)
      return NextResponse.json({ error: 'Logo read failed' }, { status: 500 })
    }

    console.log('[PDF] About to render PDF')

    let pdfBuffer
    try {
      const element = React.createElement(CertificatePDF, {
        certificate,
        logoUrl: logoBase64,
      })

      const pdfInstance = pdf(element as any)
      const buffer = await pdfInstance.toBuffer()

      console.log('[PDF] Render success')
      console.log('[PDF] Buffer length:', (buffer as any).length)

      pdfBuffer = buffer
    } catch (renderError) {
      console.error('[PDF] renderToBuffer failed:', renderError instanceof Error ? renderError.message : String(renderError))
      console.error('[PDF] renderToBuffer error details:', renderError)
      return NextResponse.json(
        {
          error: 'PDF render failed',
          details: renderError instanceof Error ? renderError.message : String(renderError),
        },
        { status: 500 }
      )
    }

    const response = new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_no}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

    console.log('[PDF] Returning response')
    return response
  } catch (error) {
    console.error('[PDF] Catch-all error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
