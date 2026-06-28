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

interface RenderResult {
  height: number
  page: number
}

interface Block {
  measure(): number
  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult
}

class Paragraph implements Block {
  constructor(private text: string, private fontSize: number = 10, private isTitle: boolean = false) {}

  private wrapText(text: string): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const charWidth = this.fontSize * 0.5

    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word
      if (testLine.length * charWidth <= CONTENT_WIDTH - 40) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine) lines.push(currentLine)
    return lines
  }

  measure(): number {
    const lines = this.wrapText(this.text)
    return lines.length * LINE_HEIGHT
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    const lines = this.wrapText(this.text)
    let currentY = y

    lines.forEach(line => {
      page.drawText(line, {
        x: MARGIN + 20,
        y: currentY,
        size: this.fontSize,
        color: this.isTitle ? ORANGE : BLACK,
      })
      currentY -= LINE_HEIGHT
    })

    return { height: lines.length * LINE_HEIGHT, page: 0 }
  }
}

class Heading implements Block {
  constructor(private text: string) {}

  measure(): number {
    return LINE_HEIGHT
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    page.drawText(this.text, {
      x: MARGIN + 20,
      y,
      size: 12,
      color: ORANGE,
    })
    return { height: LINE_HEIGHT, page: 0 }
  }
}

class LabelValue implements Block {
  constructor(private label: string, private value: string) {}

  measure(): number {
    return LINE_HEIGHT
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    page.drawText(`${this.label} ${this.value}`, {
      x: MARGIN + 20,
      y,
      size: 10,
      color: BLACK,
    })
    return { height: LINE_HEIGHT, page: 0 }
  }
}

class NumberedList implements Block {
  constructor(private items: string[], private fontSize: number = 10) {}

  private wrapText(text: string): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const charWidth = this.fontSize * 0.5

    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word
      if (testLine.length * charWidth <= CONTENT_WIDTH - 80) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine) lines.push(currentLine)
    return lines
  }

  measure(): number {
    let height = 0
    this.items.forEach(item => {
      const lines = this.wrapText(item)
      height += lines.length * LINE_HEIGHT
    })
    return height
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    let currentY = y
    let totalHeight = 0

    this.items.forEach((item, index) => {
      const lines = this.wrapText(item)

      page.drawText(`${index + 1}.`, {
        x: MARGIN + 30,
        y: currentY,
        size: this.fontSize,
        color: BLACK,
      })

      page.drawText(lines[0], {
        x: MARGIN + 50,
        y: currentY,
        size: this.fontSize,
        color: BLACK,
      })

      currentY -= LINE_HEIGHT
      totalHeight += LINE_HEIGHT

      lines.slice(1).forEach(line => {
        page.drawText(line, {
          x: MARGIN + 50,
          y: currentY,
          size: this.fontSize,
          color: BLACK,
        })
        currentY -= LINE_HEIGHT
        totalHeight += LINE_HEIGHT
      })
    })

    return { height: totalHeight, page: 0 }
  }
}

class Table implements Block {
  constructor(private headers: string[], private rows: string[][]) {}

  measure(): number {
    const rowHeight = LINE_HEIGHT + 4
    return rowHeight + this.rows.length * rowHeight
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    const colWidths = [120, 80, 130, 80, 80]
    const rowHeight = LINE_HEIGHT + 4
    const startX = MARGIN + 20

    let currentY = y
    let totalHeight = 0

    // Header
    let x = startX
    this.headers.forEach((header, i) => {
      page.drawText(header, {
        x,
        y: currentY,
        size: 9,
        color: BLACK,
      })
      x += colWidths[i]
    })

    page.drawLine({
      start: { x: startX, y: currentY - 4 },
      end: { x: startX + colWidths.reduce((a, b) => a + b, 0), y: currentY - 4 },
      thickness: 1,
      color: GRAY,
    })

    currentY -= rowHeight
    totalHeight += rowHeight

    // Rows
    this.rows.forEach(row => {
      x = startX
      row.forEach((cell, i) => {
        page.drawText(cell, {
          x,
          y: currentY,
          size: 9,
          color: BLACK,
        })
        x += colWidths[i]
      })
      currentY -= rowHeight
      totalHeight += rowHeight
    })

    return { height: totalHeight, page: 0 }
  }
}

class SignatureBlock implements Block {
  constructor(private doctorName: string) {}

  measure(): number {
    return LINE_HEIGHT * 3
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    let currentY = y

    page.drawText(`Dr. ${this.doctorName}`, {
      x: MARGIN + 20,
      y: currentY,
      size: 11,
      color: BLACK,
    })
    currentY -= LINE_HEIGHT

    page.drawText('Mobile: +91-9821224767', {
      x: MARGIN + 20,
      y: currentY,
      size: 10,
      color: BLACK,
    })
    currentY -= LINE_HEIGHT

    page.drawText('Email: ayurshalapanchkarma@gmail.com', {
      x: MARGIN + 20,
      y: currentY,
      size: 10,
      color: BLACK,
    })

    return { height: LINE_HEIGHT * 3, page: 0 }
  }
}

class Spacer implements Block {
  constructor(private height: number) {}

  measure(): number {
    return this.height
  }

  render(engine: FlowDocument, y: number, page: PDFPage): RenderResult {
    return { height: this.height, page: 0 }
  }
}

export class FlowDocument {
  private pdfDoc: PDFDocument
  private pages: PDFPage[] = []
  private currentPageIndex: number = 0
  private currentY: number = 0
  private logoImage: PDFImage | null = null
  private blocks: Block[] = []
  private headerDrawn: boolean = false

  constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc
  }

  async init(logoImage: PDFImage) {
    this.logoImage = logoImage
  }

  addBlock(block: Block) {
    this.blocks.push(block)
  }

  private drawPageBorder(page: PDFPage) {
    page.drawRectangle({
      x: MARGIN,
      y: BOTTOM_MARGIN,
      width: CONTENT_WIDTH,
      height: PAGE_HEIGHT - MARGIN - BOTTOM_MARGIN,
      borderColor: ORANGE,
      borderWidth: 1.5,
    })
  }

  private drawDocumentHeader(page: PDFPage) {
    let y = PAGE_HEIGHT - MARGIN

    // Logo - centered
    page.drawImage(this.logoImage!, {
      x: CENTER_X - 35,
      y: y - 70,
      width: 70,
      height: 70,
    })
    y -= 70 + 12

    // Clinic name - centered at font size 12
    const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
    page.drawText(clinicText, {
      x: CENTER_X - clinicText.length * 3.6,
      y,
      size: 12,
      color: BLACK,
    })
    y -= 14 + 6

    // Address - centered at font size 9
    const addr = 'SP-28, Wajidpur, Sector-130, Noida – 201301'
    page.drawText(addr, {
      x: CENTER_X - addr.length * 2.7,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 12 + 6

    // Contact - centered at font size 9
    const contact = '+91-9821224767 | ayurshalapanchkarma@gmail.com'
    page.drawText(contact, {
      x: CENTER_X - contact.length * 2.7,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 12 + 12

    // Title - centered at font size 16
    const titleText = 'DISCHARGE SUMMARY'
    page.drawText(titleText, {
      x: CENTER_X - titleText.length * 4.8,
      y,
      size: 16,
      color: ORANGE,
    })
    y -= 16 + 15

    // Separator
    page.drawLine({
      start: { x: MARGIN + 20, y },
      end: { x: PAGE_WIDTH - MARGIN - 20, y },
      thickness: 1,
      color: ORANGE,
    })
  }

  private createPage(): PDFPage {
    const page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.pages.push(page)
    this.drawPageBorder(page)

    if (!this.headerDrawn) {
      this.drawDocumentHeader(page)
      this.headerDrawn = true
      // Header: Logo(70) + gap(12) + clinic(14) + gap(6) + addr(12) + gap(6) + contact(12) + gap(12) + title(16) + gap(15) + line(0) + gap(20) = 195
      this.currentY = PAGE_HEIGHT - MARGIN - 195
    } else {
      this.currentY = PAGE_HEIGHT - MARGIN - 20
    }

    return page
  }

  async render() {
    let page = this.createPage()

    for (const block of this.blocks) {
      const blockHeight = block.measure()

      // Check if block fits on current page
      if (this.currentY - blockHeight < BOTTOM_MARGIN + 20) {
        page = this.createPage()
      }

      // Render block
      block.render(this, this.currentY, page)

      // Update cursor
      this.currentY -= blockHeight
    }

    // Add page numbers
    this.pages.forEach((p, index) => {
      p.drawText(`Page ${index + 1} of ${this.pages.length}`, {
        x: PAGE_WIDTH / 2 - 30,
        y: BOTTOM_MARGIN + 5,
        size: 9,
        color: GRAY,
      })
    })
  }

  async save(): Promise<Uint8Array> {
    return await this.pdfDoc.save()
  }
}

export { Paragraph, Heading, LabelValue, NumberedList, Table, SignatureBlock, Spacer }
