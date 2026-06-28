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

export class PDFLayoutEngine {
  private pdfDoc: PDFDocument
  private currentPage: PDFPage | null = null
  private currentY: number = 0
  private pages: PDFPage[] = []
  private logoImage: PDFImage | null = null

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

  async init(logoImage: PDFImage) {
    this.logoImage = logoImage
    await this.addNewPage()
  }

  private async addNewPage() {
    const page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pages.push(page)
    this.currentPage = page

    // Draw border
    this.currentPage.drawRectangle({
      x: MARGIN,
      y: BOTTOM_MARGIN,
      width: CONTENT_WIDTH,
      height: PAGE_HEIGHT - MARGIN - BOTTOM_MARGIN,
      borderColor: ORANGE,
      borderWidth: 1.5,
    })

    // Draw header
    await this.drawHeader()

    // Set cursor to content start (after header)
    this.currentY = PAGE_HEIGHT - MARGIN - 200
  }

  private async drawHeader() {
    if (!this.currentPage || !this.logoImage) return

    let y = PAGE_HEIGHT - MARGIN

    // Logo
    this.currentPage.drawImage(this.logoImage, {
      x: PAGE_WIDTH / 2 - 35,
      y: y - 70,
      width: 70,
      height: 70,
    })
    y -= 70 + 12

    // Clinic name
    const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
    const nameWidth = clinicText.length * 3.5
    this.currentPage.drawText(clinicText, {
      x: PAGE_WIDTH / 2 - nameWidth / 2,
      y,
      size: 12,
      color: BLACK,
    })
    y -= 14 + 6

    // Address line 1
    const addr1 = 'SP-28, Wajidpur, Sector-130, Noida – 201301'
    const addr1Width = addr1.length * 2
    this.currentPage.drawText(addr1, {
      x: PAGE_WIDTH / 2 - addr1Width / 2,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 12 + 6

    // Contact
    const contact = '+91-9821224767 | ayurshalapanchkarma@gmail.com'
    const contactWidth = contact.length * 2
    this.currentPage.drawText(contact, {
      x: PAGE_WIDTH / 2 - contactWidth / 2,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 12 + 12

    // Title
    const titleText = 'DISCHARGE SUMMARY'
    const titleWidth = titleText.length * 4
    this.currentPage.drawText(titleText, {
      x: PAGE_WIDTH / 2 - titleWidth / 2,
      y,
      size: 16,
      color: ORANGE,
    })
    y -= 16 + 10

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
      await this.addNewPage()
    }
  }

  // Returns the height actually consumed
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

  // Returns the height actually consumed
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

  // Measures wrapped lines and returns total height
  measureWrappedHeight(text: string, fontSize: number = 10): number {
    const lines = this.wrapText(this.sanitizeText(text), CONTENT_WIDTH - 40, fontSize)
    return lines.length * LINE_HEIGHT
  }

  // Draws wrapped text and returns height consumed
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

  // Measures list and returns height
  measureListHeight(items: string[], fontSize: number = 10): number {
    let height = 0
    items.forEach(item => {
      const lines = this.wrapText(this.sanitizeText(item), CONTENT_WIDTH - 80, fontSize)
      height += lines.length * LINE_HEIGHT
    })
    return height
  }

  // Draws numbered list and returns height consumed
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

  // Measures table and returns height
  measureTableHeight(rows: string[][]): number {
    const headerHeight = LINE_HEIGHT + 4
    const rowHeight = LINE_HEIGHT + 4
    return headerHeight + rows.length * rowHeight
  }

  // Draws table and returns height consumed
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

  // Measures signature block and returns height
  measureSignatureHeight(): number {
    return LINE_HEIGHT * 3
  }

  // Draws signature block and returns height consumed
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
