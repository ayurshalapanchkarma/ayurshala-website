'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Download, Plus, AlertCircle } from 'lucide-react'

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory/adjustments')
      if (!res.ok) throw new Error('Failed to load adjustments')
      const data = await res.json()
      setAdjustments(data.data || data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const filtered = adjustments || []
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  async function approveAdjustment(id: string) {
    try {
      const res = await fetch(`/api/inventory/adjustments/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to approve')
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to approve')
    }
  }

  function exportCSV() {
    const rows = [['Adjustment Type', 'Product', 'Quantity', 'Reason', 'Status']]
    filtered.forEach(a => rows.push([
      a.adjustment_type || '-',
      a.inventory_products?.name || '-',
      String(a.quantity || 0),
      a.reason || '-',
      a.approval_status || '-',
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `adjustments-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Adjustments</h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus size={16} /> New Adjustment
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading adjustments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No adjustments found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Product</th>
                  <th className="px-6 py-3 text-left font-semibold">Adjustment Type</th>
                  <th className="px-6 py-3 text-right font-semibold">Quantity</th>
                  <th className="px-6 py-3 text-left font-semibold">Reason</th>
                  <th className="px-6 py-3 text-center font-semibold">Status</th>
                  <th className="px-6 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(adj => (
                  <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 font-medium">{adj.inventory_products?.name || '-'}</td>
                    <td className="px-6 py-4">{adj.adjustment_type || '-'}</td>
                    <td className="px-6 py-4 text-right font-semibold">{adj.quantity}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">{adj.reason || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[adj.approval_status] || 'bg-gray-100 text-gray-700'}`}>
                        {adj.approval_status || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {adj.approval_status === 'PENDING' && (
                        <button onClick={() => approveAdjustment(adj.id)} className="text-green-600 hover:text-green-700 text-sm">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} adjustments</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded disabled:opacity-50 text-sm">Previous</button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-amber-600 text-white rounded disabled:opacity-50 text-sm">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
