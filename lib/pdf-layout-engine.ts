import { PDFPage, PDFDocument, rgb, PDFImage } from 'pdf-lib'

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const TOP_MARGIN = 160 // Space for header
const BOTTOM_MARGIN = 40
const PRINTABLE_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN

const LINE_HEIGHT = 14
const SECTION_SPACING = 12
const ITEM_SPACING = 10

export class PDFLayoutEngine {
  private pdfDoc: PDFDocument
  private currentPage: PDFPage | null = null
  private currentY: number = 0
  private pages: PDFPage[] = []
  private logoImage: PDFImage | null = null

  constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc
  }

  async init(logoImage: PDFImage) {
    this.logoImage = logoImage
    await this.addNewPage()
  }

  private async addNewPage() {
    const page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pages.push(page)
    this.currentPage = page
    this.currentY = PAGE_HEIGHT - MARGIN

    // Draw header
    this.drawHeader()

    // Draw border
    this.drawBorder()

    // Reset cursor to content start
    this.currentY = PAGE_HEIGHT - TOP_MARGIN
  }

  private drawHeader() {
    if (!this.currentPage || !this.logoImage) return

    // Logo
    this.currentPage.drawImage(this.logoImage, {
      x: PAGE_WIDTH / 2 - 35,
      y: PAGE_HEIGHT - MARGIN - 60,
      width: 70,
      height: 70,
    })

    // Clinic name
    const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
    const nameWidth = clinicText.length * 3.5
    this.currentPage.drawText(clinicText, {
      x: PAGE_WIDTH / 2 - nameWidth / 2,
      y: PAGE_HEIGHT - MARGIN - 90,
      size: 13,
      color: BLACK,
    })

    // Contact
    const contactText = 'SP-28, Wajidpur, Sector-130, Noida – 201301 | +91-9821224767'
    const contactWidth = contactText.length * 2.5
    this.currentPage.drawText(contactText, {
      x: PAGE_WIDTH / 2 - contactWidth / 2,
      y: PAGE_HEIGHT - MARGIN - 105,
      size: 9,
      color: GRAY,
    })

    // Title
    const titleText = 'DISCHARGE SUMMARY'
    const titleWidth = titleText.length * 4.5
    this.currentPage.drawText(titleText, {
      x: PAGE_WIDTH / 2 - titleWidth / 2,
      y: PAGE_HEIGHT - TOP_MARGIN + 10,
      size: 16,
      color: ORANGE,
    })

    // Separator line
    this.currentPage.drawLine({
      start: { x: MARGIN + 20, y: PAGE_HEIGHT - TOP_MARGIN + 5 },
      end: { x: PAGE_WIDTH - MARGIN - 20, y: PAGE_HEIGHT - TOP_MARGIN + 5 },
      thickness: 1,
      color: ORANGE,
    })
  }

  private drawBorder() {
    if (!this.currentPage) return
    this.currentPage.drawRectangle({
      x: MARGIN,
      y: BOTTOM_MARGIN,
      width: CONTENT_WIDTH,
      height: PAGE_HEIGHT - MARGIN - BOTTOM_MARGIN,
      borderColor: ORANGE,
      borderWidth: 1.5,
    })
  }

  private sanitizeText(text: string): string {
    if (!text) return ''
    return text.replace(/₂/g, '2').replace(/₃/g, '3').replace(/SpO₂/g, 'SpO2').replace(/CO₂/g, 'CO2').replace(/O₂/g, 'O2')
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const charWidth = fontSize * 0.5

    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word
      if (testLine.length * charWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine) lines.push(currentLine)
    return lines
  }

  private measureTextHeight(text: string, fontSize: number): number {
    const lines = this.wrapText(text, CONTENT_WIDTH - 40, fontSize)
    return lines.length * LINE_HEIGHT
  }

  async ensureSpace(height: number) {
    if (this.currentY - height < BOTTOM_MARGIN + 20) {
      await this.addNewPage()
    }
  }

  drawHeading(text: string): number {
    const height = LINE_HEIGHT
    this.currentPage?.drawText(text, {
      x: MARGIN + 20,
      y: this.currentY,
      size: 12,
      color: ORANGE,
    })
    return height + SECTION_SPACING
  }

  drawLabel(label: string, value: string): number {
    const text = `${label} ${this.sanitizeText(value)}`
    const height = LINE_HEIGHT
    this.currentPage?.drawText(text, {
      x: MARGIN + 20,
      y: this.currentY,
      size: 10,
      color: BLACK,
    })
    return height + ITEM_SPACING
  }

  drawWrappedText(text: string, fontSize: number = 10): number {
    const sanitized = this.sanitizeText(text)
    const lines = this.wrapText(sanitized, CONTENT_WIDTH - 40, fontSize)

    lines.forEach(line => {
      this.currentPage?.drawText(line, {
        x: MARGIN + 20,
        y: this.currentY,
        size: fontSize,
        color: BLACK,
      })
      this.currentY -= LINE_HEIGHT
    })

    return lines.length * LINE_HEIGHT + SECTION_SPACING
  }

  drawNumberedList(items: string[], fontSize: number = 10): number {
    let height = 0

    items.forEach((item, index) => {
      const lines = this.wrapText(this.sanitizeText(item), CONTENT_WIDTH - 80, fontSize)
      const bullet = `${index + 1}.`

      this.currentPage?.drawText(bullet, {
        x: MARGIN + 30,
        y: this.currentY,
        size: fontSize,
        color: BLACK,
      })

      this.currentPage?.drawText(lines[0], {
        x: MARGIN + 50,
        y: this.currentY,
        size: fontSize,
        color: BLACK,
      })

      this.currentY -= LINE_HEIGHT
      height += LINE_HEIGHT

      lines.slice(1).forEach(line => {
        this.currentPage?.drawText(line, {
          x: MARGIN + 50,
          y: this.currentY,
          size: fontSize,
          color: BLACK,
        })
        this.currentY -= LINE_HEIGHT
        height += LINE_HEIGHT
      })
    })

    this.currentY -= SECTION_SPACING
    return height + SECTION_SPACING
  }

  async drawTable(headers: string[], rows: string[][], fontSize: number = 9) {
    const colWidths = [120, 80, 130, 80, 80]
    const rowHeight = LINE_HEIGHT + 4
    const tableHeight = (rows.length + 1) * rowHeight + 10

    await this.ensureSpace(tableHeight)

    const startY = this.currentY
    const startX = MARGIN + 20

    // Header row
    let x = startX
    headers.forEach((header, i) => {
      this.currentPage?.drawText(header, { x, y: this.currentY, size: fontSize, color: BLACK })
      x += colWidths[i]
    })

    this.currentPage?.drawLine({
      start: { x: startX, y: this.currentY - 4 },
      end: { x: startX + colWidths.reduce((a, b) => a + b, 0), y: this.currentY - 4 },
      thickness: 1,
      color: GRAY,
    })

    this.currentY -= rowHeight

    // Data rows
    rows.forEach(row => {
      x = startX
      row.forEach((cell, i) => {
        this.currentPage?.drawText(this.sanitizeText(cell), { x, y: this.currentY, size: fontSize, color: BLACK })
        x += colWidths[i]
      })
      this.currentY -= rowHeight
    })

    this.currentY -= SECTION_SPACING
  }

  drawSignatureBlock(doctorName: string): number {
    const height = LINE_HEIGHT * 3
    this.currentPage?.drawText(`Dr. ${this.sanitizeText(doctorName)}`, {
      x: MARGIN + 20,
      y: this.currentY,
      size: 11,
      color: BLACK,
    })
    this.currentY -= LINE_HEIGHT
    this.currentPage?.drawText('Mobile: +91-9821224767', {
      x: MARGIN + 20,
      y: this.currentY,
      size: 10,
      color: BLACK,
    })
    this.currentY -= LINE_HEIGHT
    this.currentPage?.drawText('Email: ayurshalapanchkarma@gmail.com', {
      x: MARGIN + 20,
      y: this.currentY,
      size: 10,
      color: BLACK,
    })

    return height + SECTION_SPACING
  }

  addPageNumbers() {
    this.pages.forEach((page, index) => {
      page.drawText(`Page ${index + 1} of ${this.pages.length}`, {
        x: PAGE_WIDTH / 2 - 30,
        y: MARGIN + 5,
        size: 9,
        color: GRAY,
      })
    })
  }

  async save(): Promise<Uint8Array> {
    this.addPageNumbers()
    return await this.pdfDoc.save()
  }

  getPages(): PDFPage[] {
    return this.pages
  }

  getCurrentPage(): PDFPage | null {
    return this.currentPage
  }

  getCurrentY(): number {
    return this.currentY
  }

  setCurrentY(y: number) {
    this.currentY = y
  }

  async addNewPageExplicit() {
    await this.addNewPage()
  }
}
