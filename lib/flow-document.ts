import { PDFPage, PDFDocument, rgb, PDFImage } from 'pdf-lib'
import { globalTracer, BlockTrace, ItemTrace } from './trace-logger'

const ORANGE = rgb(249 / 255, 115 / 255, 22 / 255)
const BLACK = rgb(17 / 255, 24 / 255, 39 / 255)
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 40
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const LINE_HEIGHT = 14
const BOTTOM_MARGIN = 40  // Actual bottom margin of page
const CENTER_X = PAGE_WIDTH / 2
const SECTION_SPACING = 8

// Page break thresholds for efficient space utilization (80-90% fill target)
const MIN_SPACE_FOR_CONTENT = 40  // Minimum 40px to bother with a new page

/**
 * ARCHITECTURAL RULES:
 * 
 * 1. ONLY FlowDocument manages cursorY
 * 2. Every block returns ACTUAL rendered height
 * 3. Parent uses returned height to update cursor
 * 4. No block modifies cursorY directly
 * 5. Page breaks handled before rendering
 */

interface RenderResult {
  height: number // ACTUAL height rendered
}

interface Block {
  /**
   * Estimate how much space this block needs
   * Used for page break detection ONLY
   */
  measure(): number

  /**
   * Render the block and return ACTUAL rendered height
   * The parent MUST use this height, never the estimated height
   */
  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult
}

class Paragraph implements Block {
  constructor(private text: string, private fontSize: number = 10) {}

  private wrapLines(maxWidth: number): string[] {
    const words = this.text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const charWidth = this.fontSize * 0.55

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
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

  measure(): number {
    const lines = this.wrapLines(CONTENT_WIDTH - 40)
    const height = lines.length * LINE_HEIGHT
    console.log(`[PARAGRAPH_MEASURE] text="${this.text.substring(0, 50)}...", lines=${lines.length}, height=${height}`)
    return height
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    const wrappingWidth = contentWidth - 40
    const lines = this.wrapLines(wrappingWidth)
    let currentY = y

    console.log(`[PARAGRAPH_RENDER_START] y=${y}, contentWidth=${contentWidth}, wrappingWidth=${wrappingWidth}, lines=${lines.length}`)

    lines.forEach((line, idx) => {
      console.log(`  Line ${idx + 1}/${lines.length}: y=${currentY}, text="${line.substring(0, 60)}"`)
      page.drawText(line, {
        x: x + 20,
        y: currentY,
        size: this.fontSize,
        color: BLACK,
      })
      currentY -= LINE_HEIGHT
    })

    const actualHeight = lines.length * LINE_HEIGHT
    console.log(`[PARAGRAPH_RENDER_END] height=${actualHeight}, startY=${y}, endY=${currentY}, expectedEnd=${y - actualHeight}`)
    return { height: actualHeight }
  }
}

class Heading implements Block {
  constructor(private text: string) {}

  measure(): number {
    return LINE_HEIGHT + 6
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    page.drawText(this.text, {
      x: x + 20,
      y,
      size: 12,
      color: ORANGE,
    })
    const actualHeight = LINE_HEIGHT + 6
    console.log(`[HEADING_RENDER] text="${this.text}", height=${actualHeight}, y=${y}`)
    return { height: actualHeight }
  }
}

class LabelValue implements Block {
  constructor(private label: string, private value: string) {}

  measure(): number {
    return LINE_HEIGHT
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    const text = `${this.label} ${this.value}`
    page.drawText(text, {
      x: x + 20,
      y,
      size: 10,
      color: BLACK,
    })
    const actualHeight = LINE_HEIGHT
    console.log(`[LABELVALUE_RENDER] label="${this.label}", height=${actualHeight}, y=${y}`)
    return { height: actualHeight }
  }
}

class NumberedList implements Block {
  constructor(private items: string[], private fontSize: number = 10) {}

  private wrapLines(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const charWidth = this.fontSize * 0.55

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
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

  measure(): number {
    let height = 0
    let totalLines = 0
    this.items.forEach(item => {
      const lines = this.wrapLines(item, CONTENT_WIDTH - 80)
      totalLines += lines.length
      height += lines.length * LINE_HEIGHT
    })
    const itemSpacing = (this.items.length - 1) * 2
    const total = height + itemSpacing
    console.log(`[NUMBEREDLIST_MEASURE] items=${this.items.length}, totalLines=${totalLines}, itemsHeight=${height}, spacing=${itemSpacing}, total=${total}`)
    return total
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    let currentY = y
    let totalHeight = 0
    let linesPerItem: number[] = []
    let itemsDrawn = 0

    this.items.forEach((item, index) => {
      const lines = this.wrapLines(item, contentWidth - 80)
      linesPerItem.push(lines.length)

      // Draw number
      page.drawText(`${index + 1}.`, {
        x: x + 30,
        y: currentY,
        size: this.fontSize,
        color: BLACK,
      })

      // Draw first line of item
      page.drawText(lines[0], {
        x: x + 50,
        y: currentY,
        size: this.fontSize,
        color: BLACK,
      })

      currentY -= LINE_HEIGHT
      totalHeight += LINE_HEIGHT
      itemsDrawn++

      // Draw continuation lines
      lines.slice(1).forEach(line => {
        page.drawText(line, {
          x: x + 50,
          y: currentY,
          size: this.fontSize,
          color: BLACK,
        })
        currentY -= LINE_HEIGHT
        totalHeight += LINE_HEIGHT
        itemsDrawn++
      })

      // Spacing between items
      if (index < this.items.length - 1) {
        currentY -= 2
        totalHeight += 2
      }
    })

    console.log(`[NUMBEREDLIST_RENDER] items=${this.items.length}, linesPerItem=${linesPerItem.join(',')}, linesDrawn=${itemsDrawn}, totalHeight=${totalHeight}, y=${y}, endY=${currentY}`)
    return { height: totalHeight }
  }
}

class MedicineTable implements Block {
  constructor(private medicines: Array<{ name: string; dosage: string; instructions: string; schedule: string; duration: string }>) {}

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    const charWidth = fontSize * 0.5

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
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

  private getRowHeight(medicine: any): number {
    const colWidths = [100, 60, 120, 70, 70]
    const fontSize = 9
    let maxLines = 1

    // Check each column for wrapped text
    const fields = [medicine.name, medicine.dosage, medicine.instructions, medicine.schedule, medicine.duration]
    fields.forEach((field, i) => {
      const lines = this.wrapText(field, colWidths[i] - 4, fontSize)
      maxLines = Math.max(maxLines, lines.length)
    })

    return maxLines * LINE_HEIGHT + 4
  }

  measure(): number {
    let height = LINE_HEIGHT + 4 // header
    this.medicines.forEach(medicine => {
      height += this.getRowHeight(medicine)
    })
    return height
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    const colWidths = [100, 60, 120, 70, 70]
    const headers = ['Medicine', 'Dosage', 'Instructions', 'Time', 'Duration']
    const fontSize = 9
    let currentY = y
    let totalHeight = 0

    // Draw header
    let colX = x + 20
    headers.forEach((header, i) => {
      page.drawText(header, {
        x: colX,
        y: currentY,
        size: fontSize,
        color: BLACK,
      })
      colX += colWidths[i]
    })

    // Separator line
    page.drawLine({
      start: { x: x + 20, y: currentY - 6 },
      end: { x: x + 20 + colWidths.reduce((a, b) => a + b, 0), y: currentY - 6 },
      thickness: 1,
      color: GRAY,
    })

    currentY -= LINE_HEIGHT + 4
    totalHeight += LINE_HEIGHT + 4

    // Draw rows
    this.medicines.forEach(medicine => {
      const rowHeight = this.getRowHeight(medicine)
      const fields = [medicine.name, medicine.dosage, medicine.instructions, medicine.schedule, medicine.duration]

      colX = x + 20
      fields.forEach((field, i) => {
        const lines = this.wrapText(field, colWidths[i] - 4, fontSize)
        let lineY = currentY

        lines.forEach(line => {
          page.drawText(line, {
            x: colX + 2,
            y: lineY,
            size: fontSize,
            color: BLACK,
          })
          lineY -= LINE_HEIGHT
        })

        colX += colWidths[i]
      })

      currentY -= rowHeight
      totalHeight += rowHeight
    })

    console.log(`[MEDICINETABLE_RENDER] medicines=${this.medicines.length}, height=${totalHeight}, y=${y}`)
    return { height: totalHeight }
  }
}

class SignatureBlock implements Block {
  constructor(private doctorName: string) {}

  measure(): number {
    return LINE_HEIGHT * 4
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    let currentY = y

    // Signature line
    page.drawLine({
      start: { x: x + 20, y: currentY },
      end: { x: x + 120, y: currentY },
      thickness: 1,
      color: BLACK,
    })

    currentY -= LINE_HEIGHT + 4

    // Doctor name (don't duplicate "Dr." prefix)
    const displayName = this.doctorName.startsWith('Dr.') 
      ? this.doctorName 
      : `Dr. ${this.doctorName}`
    
    page.drawText(displayName, {
      x: x + 20,
      y: currentY,
      size: 10,
      color: BLACK,
    })

    currentY -= LINE_HEIGHT

    // Mobile
    page.drawText('Mobile: +91-9821224767', {
      x: x + 20,
      y: currentY,
      size: 9,
      color: BLACK,
    })

    currentY -= LINE_HEIGHT

    // Email
    page.drawText('Email: ayurshalapanchkarma@gmail.com', {
      x: x + 20,
      y: currentY,
      size: 9,
      color: BLACK,
    })

    const actualHeight = LINE_HEIGHT * 4
    console.log(`[SIGNATUREBLOCK_RENDER] doctor="${this.doctorName}", height=${actualHeight}, y=${y}`)
    return { height: actualHeight }
  }
}

class Spacer implements Block {
  constructor(private height: number) {}

  measure(): number {
    return this.height
  }

  render(page: PDFPage, x: number, y: number, contentWidth: number): RenderResult {
    console.log(`[SPACER_RENDER] height=${this.height}, y=${y}`)
    return { height: this.height }
  }
}

export class FlowDocument {
  private pdfDoc: PDFDocument
  private pages: PDFPage[] = []
  private currentY: number = 0
  private logoImage: PDFImage | null = null
  private blocks: Block[] = []
  private headerDrawn: boolean = false
  private currentBlockIndex: number = 0

  constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc
  }

  async init(logoImage: PDFImage) {
    this.logoImage = logoImage
  }

  addBlock(block: Block) {
    this.blocks.push(block)
  }

  private nextBlockExists(): boolean {
    return this.currentBlockIndex + 1 < this.blocks.length
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

    // Logo
    page.drawImage(this.logoImage!, {
      x: CENTER_X - 35,
      y: y - 70,
      width: 70,
      height: 70,
    })
    y -= 82

    // Clinic name
    const clinicText = 'AYURSHALA PANCHAKARMA CENTER'
    page.drawText(clinicText, {
      x: CENTER_X - clinicText.length * 3.6,
      y,
      size: 12,
      color: BLACK,
    })
    y -= 20

    // Address
    const addr = 'SP-28, Wajidpur, Sector-130, Noida – 201301'
    page.drawText(addr, {
      x: CENTER_X - addr.length * 2.7,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 18

    // Contact
    const contact = '+91-9821224767 | ayurshalapanchkarma@gmail.com'
    page.drawText(contact, {
      x: CENTER_X - contact.length * 2.7,
      y,
      size: 9,
      color: GRAY,
    })
    y -= 24

    // Title
    const titleText = 'DISCHARGE SUMMARY'
    page.drawText(titleText, {
      x: CENTER_X - titleText.length * 4.8,
      y,
      size: 16,
      color: ORANGE,
    })
    y -= 20

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
      this.currentY = PAGE_HEIGHT - MARGIN - 240
    } else {
      this.currentY = PAGE_HEIGHT - MARGIN - 20
    }

    return page
  }

  async render() {
    let page = this.createPage()
    let pageNum = 1

    for (let i = 0; i < this.blocks.length; i++) {
      this.currentBlockIndex = i
      const block = this.blocks[i]
      const estimatedHeight = block.measure()
      const blockType = block.constructor.name
      let requiredSpace = estimatedHeight + SECTION_SPACING
      
      // SPECIAL CASE: Headings should keep at least one content line with them
      if (blockType === 'Heading' && this.nextBlockExists()) {
        requiredSpace = estimatedHeight + SECTION_SPACING + LINE_HEIGHT + SECTION_SPACING
      }

      // Page break logic: Break if content won't fit
      // Available space = current Y - bottom margin
      const availableSpace = this.currentY - BOTTOM_MARGIN
      const fitsOnCurrentPage = availableSpace >= requiredSpace
      const isAtPageTop = Math.abs(this.currentY - (PAGE_HEIGHT - MARGIN - 20)) < 5  // Within 5px of top

      if (!fitsOnCurrentPage && !isAtPageTop) {
        // Create new page (don't break if we just started a page)
        page = this.createPage()
        pageNum++
        console.log(`[PAGE_BREAK] PAGE ${pageNum}: ${blockType}: Needed=${requiredSpace}px, Had=${availableSpace}px. New page at y=${this.currentY}`)
      }

      // Render block and GET ACTUAL HEIGHT
      const cursorBefore = this.currentY
      const result = block.render(page, MARGIN, this.currentY, CONTENT_WIDTH)
      const cursorAfter = this.currentY - result.height - SECTION_SPACING

      // Log trace for evidence collection
      const blockTrace: BlockTrace = {
        block: blockType,
        type: 'N/A',
        isArray: false,
        renderer: blockType,
        measure: estimatedHeight,
        actual: result.height,
        cursorBefore,
        cursorAfter
      }
      
      globalTracer.logBlock(blockTrace)

      // DEBUG LOG - focused format for paragraph/list debugging
      if (blockType === 'NumberedList' || blockType === 'Paragraph' || blockType === 'Heading') {
        // Check if this is advice/cautions/pathya/apathya by looking at Heading before it
        const headingMarker = i > 0 && this.blocks[i-1].constructor.name === 'Heading' ? '⚠️' : '  '
        console.log(`${headingMarker}[PAGE${pageNum}] ${blockType}: before=${cursorBefore}, height=${result.height}, after=${cursorAfter}`)
      }

      // CRITICAL: Use returned height, not estimated
      this.currentY = cursorAfter
    }
    
    // Output summary at end
    console.log('\n' + globalTracer.getSummary())

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

export { Paragraph, Heading, LabelValue, NumberedList, MedicineTable, SignatureBlock, Spacer }
