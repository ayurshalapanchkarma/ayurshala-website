'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Package } from 'lucide-react'

interface StockItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  value: number
  batchCount: number
}

export default function CurrentStockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/inventory/reports/current-stock')
      if (!res.ok) throw new Error('Failed to load current stock')
      const data = await res.json()
      setItems(data.data || data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(
    i => i.productName?.toLowerCase().includes(search.toLowerCase()) ||
         i.sku?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalValue = filtered.reduce((s, i) => s + (i.value || 0), 0)
  const totalUnits = filtered.reduce((s, i) => s + (i.quantity || 0), 0)

  function exportCSV() {
    const rows = [['Product', 'SKU', 'Quantity', 'Value (₹)', 'Batches']]
    filtered.forEach(i => rows.push([i.productName, i.sku, String(i.quantity), String(i.value), String(i.batchCount)]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `current-stock-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Current Stock</h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Units</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">₹{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search by product or SKU..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading stock data...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <Package size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{search ? 'No products match your search' : 'No stock data available'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">SKU</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Value (₹)</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Batches</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(item => (
                  <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.productName}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.sku}</td>
                    <td className="px-6 py-4 text-right font-semibold">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-green-700 dark:text-green-400">₹{item.value?.toLocaleString() ?? 0}</td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">{item.batchCount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.quantity === 0 ? 'bg-red-100 text-red-700' :
                        item.quantity <= 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.quantity === 0 ? 'Out of Stock' : item.quantity <= 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
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
