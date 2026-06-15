import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function spawnPDF(payload: object): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), 'scripts', 'render-pdf.js')
    const child = spawn(process.execPath, [script])
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []
    child.stdout.on('data', (d: Buffer) => chunks.push(d))
    child.stderr.on('data', (d: Buffer) => errChunks.push(d))
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(Buffer.concat(errChunks).toString() || `PDF process exited ${code}`))
      else resolve(Buffer.concat(chunks))
    })
    child.stdin.write(JSON.stringify(payload))
    child.stdin.end()
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id, certificate_no,
        patient:patient_uuid(full_name, patient_id),
        certificate_type:certificate_type_id(name),
        issue_date, issued_by, valid_from, valid_to,
        purpose, diagnosis, treatment_details,
        recommendations, restrictions, additional_notes, status
      `)
      .eq('id', certificateId)
      .single()

    if (error || !certificate) {
      return NextResponse.json({ error: error?.message || 'Certificate not found' }, { status: 404 })
    }

    if (certificate.status !== 'ISSUED') {
      return NextResponse.json({ error: 'Certificate not issued' }, { status: 403 })
    }

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    if (!fs.existsSync(logoPath)) {
      return NextResponse.json({ error: 'Logo missing' }, { status: 500 })
    }
    const logoUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`

    const certNo = (certificate as any).certificate_no
    const verifyUrl = `https://www.ayurshalapanchkarma.com/certificates/${certNo}/verify`
    const qrUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 80 })

    const buffer = await spawnPDF({ certificate, logoUrl, qrUrl })

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${(certificate as any).certificate_no}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
