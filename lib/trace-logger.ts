/**
 * Comprehensive trace logger for PDF rendering diagnostics
 * 
 * Captures complete rendering evidence including:
 * - Block rendering details
 * - Data shape and size
 * - Height calculations
 * - Cursor positioning
 * - Environment info
 * 
 * Can be compared between dev and production for root cause analysis
 */

export interface EnvironmentInfo {
  renderVersion: string
  commitHash: string
  buildTime: string
  environment: string
  nodeVersion: string
  pdfLibVersion: string
  fontLoaded: boolean
  fontName: string
}

export interface BlockTrace {
  blockIndex: number
  section: string
  renderer: string
  dataType: string
  isArray: boolean
  itemCount?: number
  charCount?: number
  wrappedLines?: number
  estimateHeight: number
  actualHeight: number
  cursorBefore: number
  cursorAfter: number
  pageNumber: number
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
  private environment: EnvironmentInfo | null = null

  setEnvironment(env: EnvironmentInfo) {
    this.environment = env
    console.log('\n' + '='.repeat(70))
    console.log('ENVIRONMENT INFO')
    console.log('='.repeat(70))
    console.log(`Version: ${env.renderVersion}`)
    console.log(`Commit: ${env.commitHash}`)
    console.log(`Built: ${env.buildTime}`)
    console.log(`Environment: ${env.environment}`)
    console.log(`Node: ${env.nodeVersion}`)
    console.log(`PDF-Lib: ${env.pdfLibVersion}`)
    console.log(`Font: ${env.fontName} (loaded: ${env.fontLoaded})`)
    console.log('='.repeat(70) + '\n')
  }

  logBlock(trace: BlockTrace) {
    this.traces.push(trace)
    
    const gap = trace.cursorBefore - trace.actualHeight - trace.cursorAfter
    const gapOk = gap === 8 ? '✓' : '✗'
    const mismatch = trace.estimateHeight !== trace.actualHeight ? '⚠️' : '✓'
    
    console.log(`\n${gapOk}${mismatch} [TRACE] Block ${trace.blockIndex}: ${trace.section}`)
    console.log(`  renderer: ${trace.renderer}`)
    console.log(`  type: ${trace.dataType}, isArray: ${trace.isArray}`)
    
    if (trace.itemCount !== undefined) {
      console.log(`  items: ${trace.itemCount}`)
    }
    if (trace.charCount !== undefined) {
      console.log(`  chars: ${trace.charCount}`)
    }
    if (trace.wrappedLines !== undefined) {
      console.log(`  wrappedLines: ${trace.wrappedLines}`)
    }
    
    console.log(`  estimate: ${trace.estimateHeight}px`)
    console.log(`  actual: ${trace.actualHeight}px`)
    console.log(`  cursor: ${trace.cursorBefore} → ${trace.cursorAfter}`)
    console.log(`  gap: ${gap}px (expect: 8px)`)
    console.log(`  page: ${trace.pageNumber}`)
    
    if (trace.items && trace.items.length > 0) {
      console.log(`  items breakdown:`)
      trace.items.forEach(item => {
        console.log(`    [${item.index}] lines=${item.wrappedLines}, height=${item.height}px`)
      })
    }
  }

  getDetailedReport(): string {
    let report = '\n' + '='.repeat(70) + '\n'
    report += 'COMPLETE TRACE REPORT\n'
    report += '='.repeat(70) + '\n\n'
    
    if (this.environment) {
      report += 'ENVIRONMENT\n'
      report += `-`.repeat(70) + '\n'
      report += `Version: ${this.environment.renderVersion}\n`
      report += `Commit: ${this.environment.commitHash}\n`
      report += `Built: ${this.environment.buildTime}\n`
      report += `Env: ${this.environment.environment}\n`
      report += `Node: ${this.environment.nodeVersion}\n`
      report += `PDF-Lib: ${this.environment.pdfLibVersion}\n`
      report += `Font: ${this.environment.fontName}\n\n`
    }
    
    report += 'BLOCKS\n'
    report += `-`.repeat(70) + '\n'
    
    for (const trace of this.traces) {
      const gap = trace.cursorBefore - trace.actualHeight - trace.cursorAfter
      const mismatchIndicator = trace.estimateHeight !== trace.actualHeight ? '✗' : '✓'
      const gapIndicator = gap === 8 ? '✓' : '✗'
      
      report += `\n${mismatchIndicator}${gapIndicator} ${trace.section} (Block ${trace.blockIndex})\n`
      report += `  Renderer: ${trace.renderer}\n`
      report += `  Data: ${trace.dataType}, isArray=${trace.isArray}\n`
      
      if (trace.itemCount !== undefined) {
        report += `  Items: ${trace.itemCount}\n`
      }
      if (trace.charCount !== undefined) {
        report += `  Chars: ${trace.charCount}\n`
      }
      if (trace.wrappedLines !== undefined) {
        report += `  WrappedLines: ${trace.wrappedLines}\n`
      }
      
      report += `  Heights: estimate=${trace.estimateHeight}px, actual=${trace.actualHeight}px`
      if (trace.estimateHeight !== trace.actualHeight) {
        report += ` [MISMATCH: ${trace.actualHeight - trace.estimateHeight}px]\n`
      } else {
        report += `\n`
      }
      
      report += `  Cursor: before=${trace.cursorBefore}, after=${trace.cursorAfter}, gap=${gap}px`
      if (gap !== 8) {
        report += ` [ERROR: should be 8px]\n`
      } else {
        report += `\n`
      }
      
      report += `  Page: ${trace.pageNumber}\n`
      
      if (trace.items && trace.items.length > 0) {
        report += `  Items:\n`
        trace.items.forEach(item => {
          report += `    [${item.index}] "${item.text.substring(0, 50)}..." lines=${item.wrappedLines}, height=${item.height}px\n`
        })
      }
    }
    
    return report
  }

  getComparisonFormat(): string {
    let comparison = '='.repeat(70) + '\n'
    comparison += 'TRACE COMPARISON FORMAT\n'
    comparison += '='.repeat(70) + '\n\n'
    
    for (const trace of this.traces) {
      comparison += '------------------------------------------------\n'
      comparison += `${trace.section}\n`
      comparison += `renderer=${trace.renderer}\n`
      comparison += `type=${trace.dataType}\n`
      comparison += `isArray=${trace.isArray}\n`
      
      if (trace.itemCount !== undefined) {
        comparison += `items=${trace.itemCount}\n`
      }
      if (trace.charCount !== undefined) {
        comparison += `chars=${trace.charCount}\n`
      }
      if (trace.wrappedLines !== undefined) {
        comparison += `wrappedLines=${trace.wrappedLines}\n`
      }
      
      comparison += `estimate=${trace.estimateHeight}\n`
      comparison += `actual=${trace.actualHeight}\n`
      comparison += `page=${trace.pageNumber}\n`
      comparison += `before=${trace.cursorBefore}\n`
      comparison += `after=${trace.cursorAfter}\n`
    }
    
    return comparison
  }
}

export const globalTracer = new TraceLogger()
