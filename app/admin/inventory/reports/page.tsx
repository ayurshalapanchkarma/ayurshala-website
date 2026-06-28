'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Download, FileText } from 'lucide-react'

interface Report {
  name: string
  description: string
  icon: React.ReactNode
}

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState('')

  async function loadReport(type: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/inventory/reports?type=${type}`)
      if (!res.ok) throw new Error('Failed to load report')
      const data = await res.json()
      setReports(data.data || data || [])
      setSelectedReport(type)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const reportTypes = [
    { id: 'stock', name: 'Stock Summary', desc: 'Complete inventory overview' },
    { id: 'current-stock', name: 'Current Stock', desc: 'Products and quantities' },
    { id: 'low-stock', name: 'Low Stock', desc: 'Below reorder level' },
    { id: 'expiry', name: 'Expiry Report', desc: 'Batches expiring soon' },
    { id: 'valuation', name: 'Inventory Valuation', desc: 'Stock value (FIFO)' },
    { id: 'purchases', name: 'Purchase Summary', desc: 'Purchase orders & GRNs' },
    { id: 'sales', name: 'Sales Report', desc: 'Sales by product' },
    { id: 'fast-moving', name: 'Fast Moving', desc: 'Top moved products' },
    { id: 'slow-moving', name: 'Slow Moving', desc: 'No movement 30 days' },
  ]

  function exportCSV() {
    if (!reports.length) return
    const headers = Object.keys(reports[0])
    const rows = [headers]
    reports.forEach(r => rows.push(headers.map(h => String(r[h] || ''))))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `report-${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Reports</h1>
        {selectedReport && (
          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              <Download size={16} /> Export CSV
            </button>
            {selectedReport && (
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                <FileText size={16} /> Print
              </button>
            )}
          </div>
        )}
      </div>

      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map(r => (
            <button
              key={r.id}
              onClick={() => loadReport(r.id)}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition text-left"
            >
              <FileText size={24} className="text-amber-600 mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{r.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{r.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => setSelectedReport('')} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm">← Back</button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {reportTypes.find(r => r.id === selectedReport)?.name}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-gray-500">Generating report...</div>
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No data available for this report</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                  <tr>
                    {Object.keys(reports[0]).map(key => (
                      <th key={key} className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {reports.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {typeof val === 'number' ? val.toLocaleString() : String(val || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
