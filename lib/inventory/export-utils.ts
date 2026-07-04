/**
 * Export utilities for reports (CSV, PDF, Print)
 */

export function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) return ''

  const csvHeaders = headers.join(',')
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      .join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printReport(title: string, data: any[], headers: string[]) {
  const window_ = window.open('', '_blank')
  if (!window_) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `

  window_.document.write(html)
  window_.document.close()
  setTimeout(() => {
    window_.print()
  }, 250)
}
