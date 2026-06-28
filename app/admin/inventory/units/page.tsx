'use client'

import { useState, useEffect } from 'react'
import { Search, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react'
import { UnitService } from '@/lib/inventory'

interface Unit {
  id: string
  name: string
  symbol: string
  conversion_factor: number
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    try {
      setLoading(true)
      const data = await UnitService.getUnits()
      setUnits(data as any)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = units.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.symbol?.toLowerCase().includes(search.toLowerCase())
  )

  async function deleteUnit(id: string) {
    alert('Unit deletion is not available. Units are read-only system records.')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Units of Measurement</h1>
        <div className="flex gap-3">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus size={16} /> Add Unit
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search units..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading units...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No units found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Unit Name</th>
                <th className="px-6 py-3 text-left font-semibold">Symbol</th>
                <th className="px-6 py-3 text-right font-semibold">Conversion Factor</th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono font-bold text-lg">{u.symbol}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{u.conversion_factor}</td>
                  <td className="px-6 py-4 text-center flex gap-2 justify-center">
                    <button className="text-amber-600 hover:text-amber-700"><Edit size={16} /></button>
                    <button onClick={() => deleteUnit(u.id)} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
