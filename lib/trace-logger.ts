/**
 * Structured trace logger for PDF rendering diagnostics
 * 
 * Captures complete rendering evidence for debugging
 * Can be compared between dev and production
 */

export interface BlockTrace {
  block: string
  type: string
  isArray: boolean
  itemCount?: number
  charCount?: number
  renderer: string
  measure: number
  actual: number
  cursorBefore: number
  cursorAfter: number
  items?: ItemTrace[]
}

export interface ItemTrace {
  index: number
  text: string
  wrappedLines: number
  height: number
}

export class TraceLogger {
  private traces: BlockTrace[] = []

  logBlock(trace: BlockTrace) {
    this.traces.push(trace)
    
    // Output immediately for real-time debugging
    console.log(`[TRACE_BLOCK] ${trace.block}`)
    console.log(`  type: ${trace.type}`)
    console.log(`  isArray: ${trace.isArray}`)
    if (trace.itemCount !== undefined) {
      console.log(`  itemCount: ${trace.itemCount}`)
    }
    if (trace.charCount !== undefined) {
      console.log(`  charCount: ${trace.charCount}`)
    }
    console.log(`  renderer: ${trace.renderer}`)
    console.log(`  measure: ${trace.measure}`)
    console.log(`  actual: ${trace.actual}`)
    console.log(`  before: ${trace.cursorBefore}`)
    console.log(`  after: ${trace.cursorAfter}`)
    console.log(`  gap: ${trace.cursorBefore - trace.actual - trace.cursorAfter} (should be 8)`)
    
    if (trace.items && trace.items.length > 0) {
      console.log(`  items:`)
      trace.items.forEach(item => {
        console.log(`    [${item.index}] lines=${item.wrappedLines}, height=${item.height}`)
      })
    }
  }

  getFullTrace(): string {
    return this.traces
      .map(t => JSON.stringify(t, null, 2))
      .join('\n---\n')
  }

  getSummary(): string {
    let summary = 'TRACE SUMMARY\n'
    summary += '='.repeat(60) + '\n\n'
    
    for (const trace of this.traces) {
      const gap = trace.cursorBefore - trace.actual - trace.cursorAfter
      const gapOk = gap === 8 ? '✓' : '✗'
      
      summary += `${gapOk} ${trace.block}`
      summary += ` (${trace.renderer})`
      summary += ` measure=${trace.measure}, actual=${trace.actual}`
      summary += ` gap=${gap}\n`
    }
    
    return summary
  }
}

export const globalTracer = new TraceLogger()
