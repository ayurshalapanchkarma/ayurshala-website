'use client'

import { useState } from 'react'
import { MasterListPage } from '@/components/inventory/MasterListPage'

import InventoryBackButton from '@/components/inventory/InventoryBackButton'
// Simple toast implementation
const toast = {
  success: (message: string) => {
    const el = document.createElement('div')
    el.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 bg-green-600'
    el.textContent = message
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  },
  error: (message: string) => {
    const el = document.createElement('div')
    el.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 bg-red-600'
    el.textContent = message
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  },
}

interface Unit {
  uuid: string
  name: string
  short_name: string
  decimal_allowed: boolean
  is_active: boolean
  created_at: string
}

export default function UnitsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editUnit, setEditUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({ name: '', short_name: '', decimal_allowed: false })

  async function handleSave() {
    if (!formData.name.trim() || !formData.short_name.trim()) {
      toast.error('Name and short name are required')
      return
    }

    try {
      const url = editUnit ? `/api/inventory/units/${editUnit.uuid}` : '/api/inventory/units'
      const response = await fetch(url, {
        method: editUnit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.details?.[Object.keys(err.details)[0]] || err.error)
      }

      toast.success(editUnit ? 'Unit updated' : 'Unit created')
      setShowForm(false)
      setEditUnit(null)
      setFormData({ name: '', short_name: '', decimal_allowed: false })
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save unit')
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'short_name', label: 'Short Name' },
    {
      key: 'decimal_allowed',
      label: 'Decimal Allowed',
      render: (value: boolean) => (value ? 'Yes' : 'No'),
    },
  ]

  return (
    <>
      <MasterListPage
        title="Units"
        apiBase="/api/inventory/units"
        columns={columns}
        onAddClick={() => {
          setFormData({ name: '', short_name: '', decimal_allowed: false })
          setEditUnit(null)
          setShowForm(true)
        }}
        onEditClick={(unit) => {
          setFormData({
            name: unit.name,
            short_name: unit.short_name,
            decimal_allowed: unit.decimal_allowed,
          })
          setEditUnit(unit)
          setShowForm(true)
        }}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">{editUnit ? 'Edit' : 'Add'} Unit</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Name *</label>
                <input
                  type="text"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  maxLength={20}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.decimal_allowed}
                  onChange={(e) => setFormData({ ...formData, decimal_allowed: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Allow decimals</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
