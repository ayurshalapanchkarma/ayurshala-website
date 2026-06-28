'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, BookOpen } from 'lucide-react'
import { ProductService } from '@/lib/inventory'

interface LedgerEntry {
  id: string
  product_id: string
  transaction_date?: string
  movement_type?: string
  transaction_type?: string
  reference_number?: string
  qty_in?: number
  quantity_in?: number
  qty_out?: number
  quantity_out?: number
  balance?: number
  created_at: string
}

export default function StockLedgerPage() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  useEffect(() => {
    ProductService.getProducts().then(p => setProducts(p)).catch(() => {}).finally(() => setLoadingProducts(false))
  }, [])

  const load = useCallback(async () => {
    if (!selectedProduct) return
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ product_id: selectedProduct, limit: '200' })
      const res = await fetch(`/api/inventory/stock/ledger?${params}`)
      if (!res.ok) throw new Error('Failed to load ledger')
      const data = await res.json()
      setLedger(data.data || data || [])
      setPage(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [selectedProduct])

  useEffect(() => { load() }, [load])

  const filtered = ledger.filter(e => {
    const matchSearch = !search || e.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      (e.movement_type || e.transaction_type || '').toLowerCase().includes(search.toLowerCase())
    const matchStart = !startDate || e.created_at >= startDate
    const matchEnd = !endDate || e.created_at <= endDate + 'T23:59:59'
    return matchSearch && matchStart && matchEnd
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function exportCSV() {
    const rows = [['Date', 'Type', 'Reference', 'In', 'Out', 'Balance']]
    filtered.forEach(e => rows.push([
      new Date(e.created_at).toLocaleDateString(),
      e.movement_type || e.transaction_type || '-',
      e.reference_number || '-',
      String(e.qty_in ?? e.quantity_in ?? 0),
      String(e.qty_out ?? e.quantity_out ?? 0),
      String(e.balance ?? '-')
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `stock-ledger-${selectedProduct}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Ledger</h1>
        <div className="flex gap-3">
          {selectedProduct && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              <Download size={16} /> Export CSV
            </button>
          )}
          {selectedProduct && (
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">
              <RefreshCw size={16} /> Refresh
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product *</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">-- Select Product --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700">
              <Search size={16} className="text-gray-400" />
              <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Type or reference..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>
        </div>
      </div>

      {!selectedProduct ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Select a product to view its stock ledger</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading ledger entries...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No ledger entries found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Reference</th>
                  <th className="px-6 py-3 text-right font-semibold text-green-700">In</th>
                  <th className="px-6 py-3 text-right font-semibold text-red-700">Out</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(entry => {
                  const qtyIn = entry.qty_in ?? entry.quantity_in ?? 0
                  const qtyOut = entry.qty_out ?? entry.quantity_out ?? 0
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400 text-xs">{new Date(entry.created_at).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                          {entry.movement_type || entry.transaction_type || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{entry.reference_number || '-'}</td>
                      <td className="px-6 py-3 text-right font-semibold text-green-600">{qtyIn > 0 ? `+${qtyIn}` : '-'}</td>
                      <td className="px-6 py-3 text-right font-semibold text-red-600">{qtyOut > 0 ? `-${qtyOut}` : '-'}</td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-white">{entry.balance ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} total entries</p>
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
