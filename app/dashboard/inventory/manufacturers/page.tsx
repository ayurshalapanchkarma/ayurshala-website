'use client'

import { useState, useEffect } from 'react'
import { Search, RefreshCw, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { ManufacturerService } from '@/lib/inventory'

interface Manufacturer {
  id: string
  name: string
  gstin?: string
  email?: string
  phone?: string
  city?: string
  state?: string
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  async function load() {
    try {
      setLoading(true)
      const data = await ManufacturerService.getManufacturers()
      setManufacturers(data as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = manufacturers.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.gstin?.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  async function deleteManufacturer(id: string) {
    if (!confirm('Delete this manufacturer?')) return
    try {
      await ManufacturerService.deleteManufacturer(id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manufacturers</h1>
        <div className="flex gap-3">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus size={16} /> Add Manufacturer
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search by name or GSTIN..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading manufacturers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No manufacturers found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">GSTIN</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Phone</th>
                  <th className="px-6 py-3 text-left font-semibold">City, State</th>
                  <th className="px-6 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 font-medium">{m.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{m.gstin || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{m.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{m.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{m.city ? `${m.city}, ${m.state || ''}` : '-'}</td>
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button className="text-blue-600 hover:text-blue-700"><Eye size={16} /></button>
                      <button className="text-amber-600 hover:text-amber-700"><Edit size={16} /></button>
                      <button onClick={() => deleteManufacturer(m.id)} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} manufacturers</p>
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
