'use client'

import { useState, useEffect } from 'react'
import { Save, Settings as SettingsIcon, Loader } from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

interface SettingRow {
  key: string
  label: string
  value: string | number | boolean
  type: 'text' | 'number' | 'boolean'
  description?: string
  category: string
}

// Default settings structure
const DEFAULT_SETTINGS: Record<string, SettingRow> = {
  // General
  clinic_name: { key: 'clinic_name', label: 'Clinic Name', value: '', type: 'text', category: 'General' },
  default_warehouse: { key: 'default_warehouse', label: 'Default Warehouse', value: '', type: 'text', category: 'General' },
  default_currency: { key: 'default_currency', label: 'Default Currency', value: 'INR', type: 'text', category: 'General' },
  timezone: { key: 'timezone', label: 'Timezone', value: 'Asia/Kolkata', type: 'text', category: 'General' },
  date_format: { key: 'date_format', label: 'Date Format', value: 'DD-MM-YYYY', type: 'text', category: 'General' },
  fiscal_year_start: { key: 'fiscal_year_start', label: 'Fiscal Year Start (MM-DD)', value: '04-01', type: 'text', category: 'General' },

  // Stock
  allow_negative_stock: { key: 'allow_negative_stock', label: 'Allow Negative Stock', value: false, type: 'boolean', category: 'Stock' },
  auto_batch_generation: { key: 'auto_batch_generation', label: 'Auto Batch Generation', value: true, type: 'boolean', category: 'Stock' },
  low_stock_alert_percent: { key: 'low_stock_alert_percent', label: 'Low Stock Alert %', value: 20, type: 'number', category: 'Stock' },
  default_reorder_days: { key: 'default_reorder_days', label: 'Default Reorder Days', value: 30, type: 'number', category: 'Stock' },
  default_shelf_life_days: { key: 'default_shelf_life_days', label: 'Default Shelf Life (Days)', value: 365, type: 'number', category: 'Stock' },

  // Purchase
  po_number_prefix: { key: 'po_number_prefix', label: 'PO Number Prefix', value: 'PO-', type: 'text', category: 'Purchase' },
  auto_po_numbering: { key: 'auto_po_numbering', label: 'Auto PO Numbering', value: true, type: 'boolean', category: 'Purchase' },
  po_approval_required: { key: 'po_approval_required', label: 'PO Approval Required', value: false, type: 'boolean', category: 'Purchase' },
  default_tax: { key: 'default_tax', label: 'Default Tax %', value: 18, type: 'number', category: 'Purchase' },
  default_payment_terms: { key: 'default_payment_terms', label: 'Default Payment Terms (Days)', value: 30, type: 'number', category: 'Purchase' },

  // Batch
  expiry_warning_days: { key: 'expiry_warning_days', label: 'Expiry Warning Days', value: 30, type: 'number', category: 'Batch' },
  batch_fifo_enabled: { key: 'batch_fifo_enabled', label: 'FIFO Batch Selection', value: true, type: 'boolean', category: 'Batch' },
  batch_fefo_enabled: { key: 'batch_fefo_enabled', label: 'FEFO Batch Selection', value: false, type: 'boolean', category: 'Batch' },
  barcode_generation: { key: 'barcode_generation', label: 'Enable Barcode Generation', value: true, type: 'boolean', category: 'Batch' },

  // Notifications
  email_expiry_alerts: { key: 'email_expiry_alerts', label: 'Email Expiry Alerts', value: true, type: 'boolean', category: 'Notifications' },
  email_low_stock_alerts: { key: 'email_low_stock_alerts', label: 'Email Low Stock Alerts', value: true, type: 'boolean', category: 'Notifications' },
  email_purchase_alerts: { key: 'email_purchase_alerts', label: 'Email Purchase Alerts', value: false, type: 'boolean', category: 'Notifications' },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, SettingRow>>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from API
  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory/settings/general')

      if (!res.ok) {
        throw new Error('Failed to load settings')
      }

      const data = await res.json()
      const loaded = data.settings || {}

      // Merge loaded with defaults
      const merged = { ...DEFAULT_SETTINGS }
      for (const [key, value] of Object.entries(loaded)) {
        if (merged[key]) {
          merged[key].value = value
        }
      }

      setSettings(merged)
      setHasChanges(false)
    } catch (error) {
      console.error('[Settings Load Error]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)

      // Build payload
      const payload = {
        settings: Object.entries(settings).reduce((acc, [key, setting]) => {
          acc[key] = setting.value
          return acc
        }, {} as Record<string, any>),
      }

      const res = await fetch('/api/inventory/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      setHasChanges(false)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('[Settings Save Error]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    loadSettings()
    setHasChanges(false)
  }

  const categories = Array.from(new Set(Object.values(settings).map(s => s.category)))

  return (
    <div className="p-8 space-y-8">
      <InventoryPageHeader
        icon={SettingsIcon}
        iconColor="text-gray-600 dark:text-gray-400"
        bgColor="bg-gray-100 dark:bg-gray-950/40"
        title="Inventory Settings"
        subtitle="Configure your inventory system"
      />

      {/* Quick Links */}
      {/* Tax Master section removed - moved to dedicated /settings/taxes page */}

      {/* Configuration Settings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Configuration</h2>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading || saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={loading || saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{category}</h3>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {Object.values(settings)
                    .filter(s => s.category === category)
                    .map(setting => (
                      <div key={setting.key} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                        <div className="flex-1">
                          <label className="font-medium text-slate-900 dark:text-white text-sm">
                            {setting.label}
                          </label>
                          {setting.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{setting.description}</p>
                          )}
                        </div>

                        {setting.type === 'boolean' ? (
                          <button
                            onClick={() => handleSettingChange(setting.key, !setting.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              setting.value
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {setting.value ? 'Enabled' : 'Disabled'}
                          </button>
                        ) : (
                          <input
                            type={setting.type}
                            value={setting.value}
                            onChange={e => {
                              const value = setting.type === 'number' ? parseFloat(e.target.value) : e.target.value
                              handleSettingChange(setting.key, value)
                            }}
                            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm max-w-xs"
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
