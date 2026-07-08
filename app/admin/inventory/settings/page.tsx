'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { RefreshCw, Save, Plus, Settings as SettingsIcon, Percent, ChevronRight } from 'lucide-react'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

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
    <div className="p-8 space-y-8">
      <InventoryPageHeader
        icon={Settings}
        iconColor="text-gray-600 dark:text-gray-400"
        bgColor="bg-gray-100 dark:bg-gray-950/40"
        title="Settings"
        subtitle="Inventory settings"
      />
      <div>        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your inventory configuration</p>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/inventory/settings/taxes"
            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Percent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Tax Master</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage tax rates and types</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* General Settings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">General Settings</h2>
          <div className="flex gap-3">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
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
            <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
    </div>
  )
}
