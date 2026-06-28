import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
// @ts-ignore
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { APP_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

function drawSection(page: any, title: string, content: string, startY: number) {
  let y = startY
  drawText(page, title, CONTENT_LEFT, y, 11, BLACK)
  y -= 14
  
  const lines = content.split('\n').filter(l => l.trim())
  for (const line of lines) {
    if (y < BORDER_BOTTOM + 50) break
    drawText(page, line.substring(0, 100), CONTENT_LEFT, y, 9, BLACK)
    y -= 12
  }
  return y - 10
}

export async function POST(req: NextRequest) {
  try {
    const {
      patient_name,
      patient_id,
      patient_phone,
      patient_email,
      doctor_name,
      appointment_date,
      diagnosis,
      treatment,
      recommendations,
      notes,
      booking_id,
    } = await req.json()

    const logoPath = path.join(process.cwd(), 'public', 'ayurshala_text.png')
    if (!fs.existsSync(logoPath)) {
      throw new Error('Logo not found')
    }

    const logoBytes = fs.readFileSync(logoPath)
    const qrUrl = `${APP_URL}/discharge/${booking_id || patient_id}`
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
    drawCenteredText(page, 'DISCHARGE SUMMARY', y, 16, ORANGE)
    y -= 16 + 30

    // Patient details
    drawText(page, 'PATIENT INFORMATION', CONTENT_LEFT, y, 11, BLACK)
    y -= 14
    drawText(page, `Name: ${patient_name}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 12
    drawText(page, `Patient ID: ${patient_id}`, CONTENT_LEFT, y, 10, BLACK)
    y -= 12
    if (patient_phone) {
      drawText(page, `Phone: ${patient_phone}`, CONTENT_LEFT, y, 10, BLACK)
      y -= 12
    }
    y -= 8

    // Clinical details
    if (appointment_date) {
      drawText(page, `Date: ${appointment_date}`, CONTENT_LEFT, y, 10, BLACK)
      y -= 12
    }
    if (doctor_name) {
      drawText(page, `Doctor: ${doctor_name}`, CONTENT_LEFT, y, 10, BLACK)
      y -= 12
    }
    y -= 8

    // Diagnosis
    if (diagnosis) {
      y = drawSection(page, 'DIAGNOSIS', diagnosis, y)
    }

    // Treatment
    if (treatment) {
      y = drawSection(page, 'TREATMENT PROVIDED', treatment, y)
    }

    // Recommendations
    if (recommendations) {
      y = drawSection(page, 'RECOMMENDATIONS', recommendations, y)
    }

    // Additional notes
    if (notes) {
      y = drawSection(page, 'ADDITIONAL NOTES', notes, y)
    }

    // Footer with QR code
    const QR_SIZE = 50
    const qrX = BORDER_CENTER_X - QR_SIZE / 2
    page.drawImage(qr, {
      x: qrX,
      y: BORDER_BOTTOM + 20,
      width: QR_SIZE,
      height: QR_SIZE,
    })

    drawCenteredText(page, 'Electronically generated discharge summary', BORDER_BOTTOM + 5, 8, GRAY)

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="discharge-${patient_id}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Discharge PDF error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
