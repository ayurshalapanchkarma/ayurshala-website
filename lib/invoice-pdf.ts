import { PDFDocument, rgb } from 'pdf-lib'
// @ts-ignore
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { APP_URL } from '@/lib/constants'

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
const SAFETY_MARGIN = 20

function drawBorder(page: any) {
  page.drawRectangle({
    x: BORDER_LEFT,
    y: BORDER_BOTTOM,
    width: BORDER_WIDTH,
    height: BORDER_TOP - BORDER_BOTTOM,
    borderColor: ORANGE,
    borderWidth: 1.5,
  })
}

function drawCenteredText(page: any, text: string, y: number, fontSize: number, color: any): void {
  const textWidth = text.length * 0.55 * fontSize
  const x = BORDER_CENTER_X - textWidth / 2
  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    color: color,
  })
}

function splitLines(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.5
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('')
      continue
    }
    const words = para.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? current + ' ' + word : word
      if (test.length * charWidth > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawHeader(page: any, logo: any): void {
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
  const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
  const clinicFontSize = 14
  const clinicTextWidth = clinicText.length * 0.55 * clinicFontSize
  const clinicX = BORDER_LEFT + (BORDER_WIDTH - clinicTextWidth) / 2

  page.drawText(clinicText, {
    x: clinicX,
    y: y,
    size: clinicFontSize,
    color: BLACK,
  })
  y -= 14 + 14

  drawCenteredText(page, 'SP-28, Wajidpur,', y, 10, BLACK)
  y -= 10 + 6

  drawCenteredText(page, 'Sector-130, Noida – 201301', y, 10, BLACK)
  y -= 10 + 6

  drawCenteredText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', y, 9, GRAY)
  y -= 9 + 28

  // Invoice title
  drawCenteredText(page, 'INVOICE', y, 16, ORANGE)
}

function drawFooter(page: any, qr: any, doctorName: string, startY: number): void {
  const SIG_WIDTH = 180
  const QR_SIZE = 60

  const patientX = BORDER_LEFT + 40
  const doctorX = BORDER_RIGHT - 220
  const doctorCenterX = doctorX + SIG_WIDTH / 2

  let y = startY

  page.drawLine({
    start: { x: patientX, y: y },
    end: { x: patientX + SIG_WIDTH, y: y },
    color: BLACK,
  })

  page.drawLine({
    start: { x: doctorX, y: y },
    end: { x: doctorX + SIG_WIDTH, y: y },
    color: BLACK,
  })

  y -= 25

  page.drawText('Patient Signature', {
    x: patientX,
    y: y,
    size: 10,
    color: BLACK,
  })

  page.drawText('Dr. ' + doctorName, {
    x: doctorX,
    y: y,
    size: 9,
    color: BLACK,
  })

  y -= 12

  page.drawText('Ayurshala Panchakarma Center', {
    x: doctorX,
    y: y,
    size: 9,
    color: BLACK,
  })

  y -= 35 + 5

  const qrX = doctorCenterX - QR_SIZE / 2

  page.drawImage(qr, {
    x: qrX,
    y: y - QR_SIZE,
    width: QR_SIZE,
    height: QR_SIZE,
  })

  y -= QR_SIZE + 12

  const scanText = 'Scan to verify authenticity'
  const scanWidth = scanText.length * 8 * 0.55
  page.drawText(scanText, {
    x: doctorCenterX - scanWidth / 2,
    y: y,
    size: 8,
    color: GRAY,
  })

  y -= 16

  const noteText1 = 'Electronically generated invoice.'
  const noteText2 = 'No physical signature required.'
  const noteWidth1 = noteText1.length * 8 * 0.55
  const noteWidth2 = noteText2.length * 8 * 0.55

  page.drawText(noteText1, {
    x: doctorCenterX - noteWidth1 / 2,
    y: y,
    size: 8,
    color: GRAY,
  })

  page.drawText(noteText2, {
    x: doctorCenterX - noteWidth2 / 2,
    y: y - 10,
    size: 8,
    color: GRAY,
  })
}

export async function generateInvoicePDF(booking: any): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
  if (!fs.existsSync(logoPath)) {
    throw new Error('Logo missing')
  }

  const logoBytes = fs.readFileSync(logoPath)
  const qrUrl = `${APP_URL}/status/confirm?booking_id=${encodeURIComponent(booking.booking_id)}`
  const qrCodeImage = await QRCode.toDataURL(qrUrl, { width: 100 })
  const qrBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64')

  const pdfDoc = await PDFDocument.create()
  const logo = await pdfDoc.embedPng(logoBytes)
  const qr = await pdfDoc.embedPng(qrBuffer)

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  drawBorder(page)
  drawHeader(page, logo)

  let y = PAGE_HEIGHT - MARGIN - 20 - 70 - 24 - 14 - 10 - 6 - 10 - 6 - 9 - 28 - 16 - 20

  // Invoice details section
  const invData = [
    `Invoice #: INV-${booking.booking_id}`,
    `Invoice Date: ${new Date().toLocaleDateString('en-IN')}`,
    `Booking ID: ${booking.booking_id}`,
  ]

  for (const line of invData) {
    page.drawText(line, {
      x: CONTENT_LEFT,
      y: y,
      size: 10,
      color: BLACK,
    })
    y -= 14
  }

  y -= 8

  // Patient section
  page.drawText('PATIENT DETAILS', {
    x: CONTENT_LEFT,
    y: y,
    size: 11,
    color: BLACK,
  })
  y -= 12

  const patientData = [
    `Name: ${booking.patient_name}`,
    `Phone: ${booking.patient_phone}`,
    `Email: ${booking.patient_email}`,
  ]

  for (const line of patientData) {
    page.drawText(line, {
      x: CONTENT_LEFT,
      y: y,
      size: 10,
      color: BLACK,
    })
    y -= 12
  }

  y -= 8

  // Appointment section
  page.drawText('APPOINTMENT DETAILS', {
    x: CONTENT_LEFT,
    y: y,
    size: 11,
    color: BLACK,
  })
  y -= 12

  const apptData = [
    `Doctor: ${booking.doctor_name || booking.doctor || 'Not Assigned'}`,
    `Treatment: ${booking.treatments}`,
    `Date & Time: ${new Date(booking.preferred_date).toLocaleDateString('en-IN')} ${booking.preferred_time}`,
  ]

  for (const line of apptData) {
    page.drawText(line, {
      x: CONTENT_LEFT,
      y: y,
      size: 10,
      color: BLACK,
    })
    y -= 12
  }

  y -= 8

  // Charges section
  page.drawText('CHARGES', {
    x: CONTENT_LEFT,
    y: y,
    size: 11,
    color: BLACK,
  })
  y -= 12

  // Table header
  page.drawRectangle({
    x: BORDER_LEFT + 15,
    y: y - 8,
    width: CONTENT_WIDTH - 30,
    height: 10,
    color: ORANGE,
  })

  page.drawText('Description', {
    x: CONTENT_LEFT,
    y: y - 5,
    size: 9,
    color: rgb(1, 1, 1),
  })

  page.drawText('Amount', {
    x: CONTENT_LEFT + CONTENT_WIDTH - 100,
    y: y - 5,
    size: 9,
    color: rgb(1, 1, 1),
  })

  y -= 14

  const amount = booking.amount || 0
  page.drawText('Consultation Charges', {
    x: CONTENT_LEFT,
    y: y,
    size: 10,
    color: BLACK,
  })

  page.drawText(`₹${amount}`, {
    x: CONTENT_LEFT + CONTENT_WIDTH - 100,
    y: y,
    size: 10,
    color: BLACK,
  })

  y -= 14

  // Total
  page.drawRectangle({
    x: BORDER_LEFT + 15,
    y: y - 8,
    width: CONTENT_WIDTH - 30,
    height: 10,
    color: rgb(245, 245, 245),
  })

  page.drawText('Grand Total', {
    x: CONTENT_LEFT,
    y: y - 5,
    size: 10,
    color: BLACK,
  })

  page.drawText(`₹${amount}`, {
    x: CONTENT_LEFT + CONTENT_WIDTH - 100,
    y: y - 5,
    size: 10,
    color: BLACK,
  })

  y -= 16

  // Payment status
  page.drawText(`Payment Status: ${booking.payment_status === 'PAID' ? 'PAID' : 'PENDING'}`, {
    x: CONTENT_LEFT,
    y: y,
    size: 10,
    color: BLACK,
  })

  y -= 40

  // Footer
  drawFooter(page, qr, booking.doctor_name || booking.doctor || 'Clinic Staff', y)

  return Buffer.from(await pdfDoc.save())
}
