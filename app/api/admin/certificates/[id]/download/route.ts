import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        patient:patient_uuid(full_name, patient_id),
        certificate_type:certificate_type_id(name)
      `)
      .eq('id', certificateId)
      .single()

    if (error || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Generate HTML that can be printed to PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.certificate_number}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 40px;
      background: white;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #333;
      padding: 40px;
      text-align: center;
    }
    .header {
      border-bottom: 1px solid #999;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      color: #1a472a;
    }
    .header p {
      margin: 5px 0;
      font-size: 12px;
      color: #555;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin: 30px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #1a472a;
    }
    .cert-details {
      margin: 20px 0;
      font-size: 12px;
    }
    .section {
      text-align: left;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .section-content {
      margin-left: 20px;
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      text-align: left;
    }
    .info-block {
      font-size: 12px;
    }
    .info-label {
      font-weight: bold;
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 13px;
      color: #333;
    }
    .footer {
      border-top: 1px solid #999;
      margin-top: 40px;
      padding-top: 20px;
      font-size: 12px;
    }
    .signature {
      margin-top: 30px;
      display: inline-block;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #333;
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
    }
    .disclaimer {
      font-size: 10px;
      color: #666;
      margin-top: 20px;
      font-style: italic;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AYURSHALA PANCHAKARMA CENTER</h1>
      <p>SP-28, Wajidpur, Sector-130, Noida – 201301</p>
      <p>+91-9821224767  |  ayurshalapanchkarma@gmail.com</p>
    </div>

    <div class="title">${certificate.certificate_type.name}</div>

    <div class="cert-details">
      <p><strong>Certificate No:</strong> ${certificate.certificate_number}</p>
      <p><strong>Date Issued:</strong> ${new Date(certificate.issue_date).toLocaleDateString('en-IN')}</p>
    </div>

    <div class="patient-info">
      <div class="info-block">
        <div class="info-label">PATIENT NAME</div>
        <div class="info-value">${certificate.patient.full_name}</div>
      </div>
      <div class="info-block">
        <div class="info-label">PATIENT ID</div>
        <div class="info-value">${certificate.patient.patient_id}</div>
      </div>
    </div>

    ${certificate.valid_from || certificate.valid_to ? `
    <div class="section">
      <div class="section-title">VALIDITY</div>
      <div class="section-content">
        ${certificate.valid_from ? `Valid From: ${new Date(certificate.valid_from).toLocaleDateString('en-IN')}\n` : ''}
        ${certificate.valid_to ? `Valid To: ${new Date(certificate.valid_to).toLocaleDateString('en-IN')}` : ''}
      </div>
    </div>
    ` : ''}

    ${certificate.purpose ? `
    <div class="section">
      <div class="section-title">PURPOSE</div>
      <div class="section-content">${certificate.purpose}</div>
    </div>
    ` : ''}

    ${certificate.diagnosis ? `
    <div class="section">
      <div class="section-title">DIAGNOSIS</div>
      <div class="section-content">${certificate.diagnosis}</div>
    </div>
    ` : ''}

    ${certificate.treatment_details ? `
    <div class="section">
      <div class="section-title">TREATMENT DETAILS</div>
      <div class="section-content">${certificate.treatment_details}</div>
    </div>
    ` : ''}

    ${certificate.recommendations ? `
    <div class="section">
      <div class="section-title">RECOMMENDATIONS</div>
      <div class="section-content">${certificate.recommendations}</div>
    </div>
    ` : ''}

    ${certificate.restrictions ? `
    <div class="section">
      <div class="section-title">RESTRICTIONS</div>
      <div class="section-content">${certificate.restrictions}</div>
    </div>
    ` : ''}

    ${certificate.additional_notes ? `
    <div class="section">
      <div class="section-title">ADDITIONAL NOTES</div>
      <div class="section-content">${certificate.additional_notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Issued By:</strong> ${certificate.issued_by}</p>
      
      <div class="signature">
        <div class="sig-line">
          Doctor Signature
        </div>
      </div>

      <div class="disclaimer">
        This certificate is electronically generated by Ayurshala Panchakarma Center.
      </div>
    </div>
  </div>

  <script>
    // Auto-trigger print dialog
    window.print();
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json({ error: 'Certificate generation failed' }, { status: 500 })
  }
}
