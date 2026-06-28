'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Save, Plus } from 'lucide-react'

interface Setting {
  key: string
  value: any
  category: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      // Transform to Setting format
      setSettings(Object.entries(data).map(([k, v]: any) => ({
        key: k,
        value: v,
        category: 'General',
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    try {
      const body = Object.fromEntries(settings.map(s => [s.key, s.value]))
      const res = await fetch('/api/inventory/settings', { method: 'POST', body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Settings</h1>
        <div className="flex gap-3">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <RefreshCw size={16} /> Reload
          </button>
          <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 p-4 rounded-lg text-green-700">
          ✓ Settings saved successfully
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading settings...</div>
      ) : settings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No settings configured</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
          {settings.map(s => (
            <div key={s.key} className="border-b p-6 last:border-b-0 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white capitalize">{s.key.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.category}</p>
              </div>
              <input
                type="text"
                value={String(s.value || '')}
                onChange={e => {
                  const updated = [...settings]
                  const idx = updated.findIndex(x => x.key === s.key)
                  updated[idx].value = e.target.value
                  setSettings(updated)
                }}
                className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm max-w-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
