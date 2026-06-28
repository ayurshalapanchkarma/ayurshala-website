import { PDFPage, PDFImage, rgb } from 'pdf-lib'

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 18 * 2.834

const BORDER_LEFT = MARGIN
const BORDER_RIGHT = PAGE_WIDTH - MARGIN
const BORDER_TOP = PAGE_HEIGHT - MARGIN
const BORDER_WIDTH = BORDER_RIGHT - BORDER_LEFT
const BORDER_CENTER_X = BORDER_LEFT + BORDER_WIDTH / 2

const HEADER_START_Y = BORDER_TOP - 20
const HEADER_HEIGHT = 70 + 24 + 14 + 14 + 10 + 10 + 10 + 14 + 9 + 28 + 16 + 30

function drawCenteredText(page: PDFPage, text: string, y: number, fontSize: number, color: any): void {
  const textWidth = text.length * 0.55 * fontSize
  const x = BORDER_CENTER_X - textWidth / 2
  page.drawText(text, { x, y, size: fontSize, color })
}

export function drawClinicHeader(page: PDFPage, logo: PDFImage, title: string): number {
  let y = HEADER_START_Y

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
  page.drawText(clinicText, { x: clinicX, y, size: clinicFontSize, color: BLACK })
  y -= 14 + 14

  drawCenteredText(page, 'SP-28, Wajidpur,', y, 10, BLACK)
  y -= 10 + 6

  drawCenteredText(page, 'Sector-130, Noida – 201301', y, 10, BLACK)
  y -= 10 + 6

  drawCenteredText(page, '+91-9821224767 | ayurshalapanchkarma@gmail.com', y, 9, GRAY)
  y -= 9 + 28

  // Title
  const titleText = title.toUpperCase()
  const titleFontSize = 16
  const titleTextWidth = titleText.length * 0.55 * titleFontSize
  const titleX = BORDER_LEFT + (BORDER_WIDTH - titleTextWidth) / 2
  page.drawText(titleText, { x: titleX, y, size: titleFontSize, color: ORANGE })
  y -= 16 + 30

  // Horizontal line
  page.drawLine({
    start: { x: BORDER_LEFT + 20, y: y + 5 },
    end: { x: BORDER_RIGHT - 20, y: y + 5 },
    thickness: 1,
    color: ORANGE,
  })

  return y - 10
}
