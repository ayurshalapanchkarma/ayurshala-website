import { PDFPage, PDFDocument, rgb, PDFImage } from 'pdf-lib'

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const LINE_HEIGHT = 14
const BOTTOM_MARGIN = 40
const CENTER_X = PAGE_WIDTH / 2

export class PDFLayoutEngine {
  private pdfDoc: PDFDocument
  private currentPage: PDFPage | null = null
  private currentY: number = 0
  private pages: PDFPage[] = []
  private logoImage: PDFImage | null = null
  private isFirstPage: boolean = true

  constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc
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

  private getTextWidth(text: string, fontSize: number): number {
    return text.length * fontSize * 0.5
  }

  async init(logoImage: PDFImage) {
    this.logoImage = logoImage
    await this.addFirstPage()
  }

  private async addFirstPage() {
    const page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pages.push(page)
    this.currentPage = page

    // Draw border
    this.drawPageBorder()

    // Draw document header
    this.drawDocumentHeader()

    // Set cursor to content start
    this.currentY = PAGE_HEIGHT - MARGIN - 240
  }

  private async addContinuationPage() {
    const page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pages.push(page)
    this.currentPage = page

    // Draw border only
    this.drawPageBorder()

    // Set cursor to content start
    this.currentY = PAGE_HEIGHT - MARGIN - 20
  }

  private drawPageBorder() {
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

  private drawDocumentHeader() {
    if (!this.currentPage || !this.logoImage) return

    let y = PAGE_HEIGHT - MARGIN

    // Logo - centered
    this.currentPage.drawImage(this.logoImage, {
      x: CENTER_X - 35,
      y: y - 70,
      width: 70,
      height: 70,
    })
    y -= 70 + 12

    // Clinic name - centered
    const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
    const clinicWidth = this.getTextWidth(clinicText, 12)
    this.currentPage.drawText(clinicText, {
      x: CENTER_X - clinicWidth / 2,
      y,
      size: 12,
      color: BLACK,
    })
    y -= 14 + 6

    // Address - centered
    const addr = 'SP-28, Wajidpur, Sector-130, Noida – 201301'
    const addrWidth = this.getTextWidth(addr, 9)
    this.currentPage.drawText(addr, {
      x: CENTER_X - addrWidth / 2,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 12 + 6

    // Contact - centered
    const contact = '+91-9821224767 | ayurshalapanchkarma@gmail.com'
    const contactWidth = this.getTextWidth(contact, 9)
    this.currentPage.drawText(contact, {
      x: CENTER_X - contactWidth / 2,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 12 + 12

    // Title - centered
    const titleText = 'DISCHARGE SUMMARY'
    const titleWidth = this.getTextWidth(titleText, 16)
    this.currentPage.drawText(titleText, {
      x: CENTER_X - titleWidth / 2,
      y,
      size: 16,
      color: ORANGE,
    })
    y -= 16 + 15

    // Separator line
    this.currentPage.drawLine({
      start: { x: MARGIN + 20, y },
      end: { x: PAGE_WIDTH - MARGIN - 20, y },
      thickness: 1,
      color: ORANGE,
    })
  }

  async ensureSpace(height: number) {
    if (this.currentY - height < BOTTOM_MARGIN + 20) {
      await this.addContinuationPage()
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
    return height
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
    return height
  }

  measureWrappedHeight(text: string, fontSize: number = 10): number {
    const lines = this.wrapText(this.sanitizeText(text), CONTENT_WIDTH - 40, fontSize)
    return lines.length * LINE_HEIGHT
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

    return lines.length * LINE_HEIGHT
  }

  measureListHeight(items: string[], fontSize: number = 10): number {
    let height = 0
    items.forEach(item => {
      const lines = this.wrapText(this.sanitizeText(item), CONTENT_WIDTH - 80, fontSize)
      height += lines.length * LINE_HEIGHT
    })
    return height
  }

  drawNumberedList(items: string[], fontSize: number = 10): number {
    let height = 0

    items.forEach((item, index) => {
      const lines = this.wrapText(this.sanitizeText(item), CONTENT_WIDTH - 80, fontSize)

      this.currentPage?.drawText(`${index + 1}.`, {
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

    return height
  }

  measureTableHeight(rows: string[][]): number {
    const headerHeight = LINE_HEIGHT + 4
    const rowHeight = LINE_HEIGHT + 4
    return headerHeight + rows.length * rowHeight
  }

  async drawTable(headers: string[], rows: string[][], fontSize: number = 9) {
    const colWidths = [120, 80, 130, 80, 80]
    const rowHeight = LINE_HEIGHT + 4
    const startX = MARGIN + 20

    let height = 0
    const headerHeight = rowHeight

    // Header
    let x = startX
    headers.forEach((header, i) => {
      this.currentPage?.drawText(header, {
        x,
        y: this.currentY,
        size: fontSize,
        color: BLACK,
      })
      x += colWidths[i]
    })

    this.currentPage?.drawLine({
      start: { x: startX, y: this.currentY - 4 },
      end: { x: startX + colWidths.reduce((a, b) => a + b, 0), y: this.currentY - 4 },
      thickness: 1,
      color: GRAY,
    })

    this.currentY -= headerHeight
    height += headerHeight

    // Data rows
    for (const row of rows) {
      await this.ensureSpace(rowHeight + 20)

      x = startX
      row.forEach((cell, i) => {
        this.currentPage?.drawText(this.sanitizeText(cell), {
          x,
          y: this.currentY,
          size: fontSize,
          color: BLACK,
        })
        x += colWidths[i]
      })

      this.currentY -= rowHeight
      height += rowHeight
    }

    return height
  }

  measureSignatureHeight(): number {
    return LINE_HEIGHT * 3
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
    this.currentY -= LINE_HEIGHT

    return height
  }

  addPageNumbers() {
    this.pages.forEach((page, index) => {
      page.drawText(`Page ${index + 1} of ${this.pages.length}`, {
        x: PAGE_WIDTH / 2 - 30,
        y: BOTTOM_MARGIN + 5,
        size: 9,
        color: GRAY,
      })
    })
  }

  async save(): Promise<Uint8Array> {
    this.addPageNumbers()
    return await this.pdfDoc.save()
  }

  getCurrentY(): number {
    return this.currentY
  }

  setCurrentY(y: number) {
    this.currentY = y
  }
}
