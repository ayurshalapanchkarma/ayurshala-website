import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
// @ts-ignore
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 18 * 2.834

const BORDER_LEFT = MARGIN
const BORDER_RIGHT = PAGE_WIDTH - MARGIN
const BORDER_TOP = PAGE_HEIGHT - MARGIN
const BORDER_BOTTOM = MARGIN
const BORDER_WIDTH = BORDER_RIGHT - BORDER_LEFT
const BORDER_CENTER_X = BORDER_LEFT + BORDER_WIDTH / 2

const CONTENT_LEFT = BORDER_LEFT + 20
const CONTENT_WIDTH = BORDER_WIDTH - 40

function drawText(page: any, text: string, x: number, y: number, size: number, color: any) {
  page.drawText(text, { x, y, size, color })
}

function drawCenteredText(page: any, text: string, y: number, fontSize: number, color: any) {
  const textWidth = text.length * 0.55 * fontSize
  const x = BORDER_CENTER_X - textWidth / 2
  drawText(page, text, x, y, fontSize, color)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params

    const { data: booking, error } = await supabase
      .from('bookings_new')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Fetch patient data
    const { data: patient } = await supabase
      .from('patients')
      .select('full_name, patient_id, phone, email')
      .eq('id', booking.patient_uuid)
      .single()

    // Fetch treatments
    const { data: treatments } = await supabase
      .from('booking_treatments_v2')
      .select('treatment_name')
      .eq('booking_uuid', booking.id)

    // Fetch payment amount
    const { data: payment } = await supabase
      .from('payments')
      .select('amount')
      .eq('booking_uuid', booking.id)
      .single()

    const patient_name = patient?.full_name || booking.patient_name || 'Patient'
    const patient_phone = patient?.phone || booking.patient_phone || ''
    const patient_email = patient?.email || booking.patient_email || ''
    const treatments_str = treatments?.map(t => t.treatment_name).join(', ') || 'Consultation'
    const amount = payment?.amount || booking.amount || 0

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    if (!fs.existsSync(logoPath)) {
      throw new Error('Logo not found')
    }

    const logoBytes = fs.readFileSync(logoPath)
    const qrUrl = `${APP_URL}/status/confirm?booking_id=${encodeURIComponent(booking.booking_id)}`
    const qrCodeImage = await QRCode.toDataURL(qrUrl, { width: 100 })
    const qrBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64')

    const pdfDoc = await PDFDocument.create()
    const logo = await pdfDoc.embedPng(logoBytes)
    const qr = await pdfDoc.embedPng(qrBuffer)

    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

    // Border
    page.drawRectangle({
      x: BORDER_LEFT,
      y: BORDER_BOTTOM,
      width: BORDER_WIDTH,
      height: BORDER_TOP - BORDER_BOTTOM,
      borderColor: ORANGE,
      borderWidth: 1.5,
    })

    let y = PAGE_HEIGHT - MARGIN - 20

    // Logo
    page.drawImage(logo, {
      x: BORDER_CENTER_X - 35,
      y: y - 70,
      width: 70,
      height: 70,
    })
    y -= 70 + 24

    // Clinic name
    drawCenteredText(page, 'AYURSHALA PANCHAKARMA CENTER', y, 14, BLACK)
    y -= 14 + 14

    drawCenteredText(page, 'SP-28, Wajidpur, Sector-130, Noida – 201301', y, 10, BLACK)
    y -= 10 + 6

    drawCenteredText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', y, 9, GRAY)
    y -= 9 + 28

    // Title
    drawCenteredText(page, 'INVOICE', y, 16, ORANGE)
    y -= 16 + 30

    // Invoice details
    drawText(page, `Invoice #: INV-${booking.booking_id}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 14
    drawText(page, `Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 14
    drawText(page, `Booking ID: ${booking.booking_id}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 20

    // Patient details
    drawText(page, 'PATIENT DETAILS', CONTENT_LEFT, y, 11, BLACK)
    y -= 14
    drawText(page, `Name: ${patient_name}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 12
    drawText(page, `Phone: ${patient_phone}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 12
    drawText(page, `Email: ${patient_email}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 20

    // Appointment details
    drawText(page, 'APPOINTMENT DETAILS', CONTENT_LEFT, y, 11, BLACK)
    y -= 14
    drawText(page, `Doctor: ${booking.doctor_name || booking.doctor || 'Not Selected'}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 12
    drawText(page, `Treatment: ${treatments_str}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 12
    const apptDate = new Date(booking.preferred_date).toLocaleDateString('en-IN')
    drawText(page, `Date & Time: ${apptDate} ${booking.preferred_time}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 20

    // Charges
    drawText(page, 'CHARGES', CONTENT_LEFT, y, 11, BLACK)
    y -= 14

    // Amount
    drawText(page, 'Consultation Charges', CONTENT_LEFT, y, 10, BLACK)
    drawText(page, `₹${amount}`, BORDER_RIGHT - 80, y, 10, BLACK)
    y -= 18

    // Total
    page.drawRectangle({
      x: BORDER_LEFT + 15,
      y: y - 8,
      width: CONTENT_WIDTH - 30,
      height: 10,
      color: rgb(245, 245, 245),
    })
    drawText(page, 'Grand Total', CONTENT_LEFT, y - 5, 10, BLACK)
    drawText(page, `₹${amount}`, BORDER_RIGHT - 80, y - 5, 10, BLACK)
    y -= 20

    // Payment status
    drawText(page, `Payment Status: ${booking.payment_status === 'PAID' ? 'PAID' : 'PENDING'}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 40

    // Footer - signatures
    const SIG_Y = BORDER_BOTTOM + 100
    const SIG_WIDTH = 180
    const QR_SIZE = 60

    const patientX = BORDER_LEFT + 40
    const doctorX = BORDER_RIGHT - 220

    page.drawLine({
      start: { x: patientX, y: SIG_Y },
      end: { x: patientX + SIG_WIDTH, y: SIG_Y },
      color: BLACK,
    })

    page.drawLine({
      start: { x: doctorX, y: SIG_Y },
      end: { x: doctorX + SIG_WIDTH, y: SIG_Y },
      color: BLACK,
    })

    drawText(page, 'Patient Signature', patientX, SIG_Y - 25, 10, BLACK)
    drawText(page, `Dr. ${booking.doctor_name || booking.doctor || 'Clinic Staff'}`, doctorX, SIG_Y - 25, 9, BLACK)

    // QR code
    const qrX = BORDER_CENTER_X - QR_SIZE / 2
    page.drawImage(qr, {
      x: qrX,
      y: SIG_Y - 85,
      width: QR_SIZE,
      height: QR_SIZE,
    })

    drawCenteredText(page, 'Scan to verify', SIG_Y - 100, 8, GRAY)

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${bookingId}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Invoice PDF error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
