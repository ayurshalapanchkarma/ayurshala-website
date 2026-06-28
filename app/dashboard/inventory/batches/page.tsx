'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Plus, Loader } from 'lucide-react'
import { BatchService, ProductService } from '@/lib/inventory'

interface Batch {
  id: string
  batch_number: string
  product_id: string
  product_name?: string
  mfg_date?: string
  exp_date: string
  initial_quantity: number
  current_quantity: number
  purchase_price: number
  status: 'ACTIVE' | 'LOW_STOCK' | 'EXPIRED' | 'DEPLETED' | 'BLOCKED'
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  useEffect(() => {
    ProductService.getProducts().then(p => setProducts(p)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await BatchService.getBatches(selectedProduct || undefined)
      setBatches(data as any)
      setPage(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load batches')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }, [selectedProduct])

  useEffect(() => { load() }, [load])

  const allStatuses = [...new Set(batches.map(b => b.status).filter(Boolean))]

  const filtered = batches.filter(b => {
    const matchSearch = !search || b.batch_number?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function exportCSV() {
    const rows = [['Batch Number', 'Mfg Date', 'Exp Date', 'Initial Qty', 'Current Qty', 'Purchase Price', 'Value', 'Status']]
    filtered.forEach(b => rows.push([
      b.batch_number,
      b.mfg_date ? new Date(b.mfg_date).toLocaleDateString() : '-',
      new Date(b.exp_date).toLocaleDateString(),
      String(b.initial_quantity),
      String(b.current_quantity),
      String(b.purchase_price),
      String(b.current_quantity * b.purchase_price),
      b.status,
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `batches-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const totalValue = filtered.reduce((s, b) => s + (b.current_quantity * b.purchase_price), 0)
  const totalQuantity = filtered.reduce((s, b) => s + b.current_quantity, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Batches</h1>
        <div className="flex gap-3">
          {selectedProduct && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              <Download size={16} /> Export CSV
            </button>
          )}
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product (Optional)</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">All Products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">All Status</option>
              {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700">
              <Search size={16} className="text-gray-400" />
              <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Batch number..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2">
              <Plus size={16} /> New Batch
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Batches</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{filtered.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalQuantity.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-green-600">₹{totalValue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={40} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No batches found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Batch Number</th>
                  <th className="px-6 py-3 text-left font-semibold">Mfg Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Exp Date</th>
                  <th className="px-6 py-3 text-right font-semibold">Qty</th>
                  <th className="px-6 py-3 text-right font-semibold">Price</th>
                  <th className="px-6 py-3 text-right font-semibold">Value (₹)</th>
                  <th className="px-6 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(batch => {
                  const isExpired = new Date(batch.exp_date) < new Date()
                  return (
                    <tr key={batch.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${isExpired ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-6 py-4 font-medium font-mono text-xs">{batch.batch_number}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{batch.mfg_date ? new Date(batch.mfg_date).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">{new Date(batch.exp_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-semibold">{batch.current_quantity}</td>
                      <td className="px-6 py-4 text-right">₹{batch.purchase_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">₹{(batch.current_quantity * batch.purchase_price).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          batch.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                          batch.status === 'DEPLETED' ? 'bg-gray-100 text-gray-700' :
                          batch.status === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} batches</p>
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
