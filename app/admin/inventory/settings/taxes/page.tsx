'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Percent, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'


interface TaxMaster {
  uuid: string
  tax_name: string
  tax_code?: string
  tax_rate: number
  tax_type: 'GST' | 'VAT' | 'SALES_TAX' | 'OTHER'
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ListResponse {
  data: TaxMaster[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const defaultFormData = {
  tax_name: '',
  tax_code: '',
  tax_rate: '',
  tax_type: 'GST' as const,
  description: ''}

const TAX_TYPES = [
  { value: 'GST', label: 'GST (Goods & Services Tax)' },
  { value: 'VAT', label: 'VAT (Value Added Tax)' },
  { value: 'SALES_TAX', label: 'Sales Tax' },
  { value: 'OTHER', label: 'Other' },
]

export default function TaxMasterPage() {
  const [taxes, setTaxes] = useState<TaxMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<TaxMaster | null>(null)

  const pageSize = 10

  useEffect(() => {
    loadTaxes()
  }, [page, search])

  async function loadTaxes() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: pageSize.toString()})

      const response = await fetch(`/api/inventory/settings/taxes?${params}`)
      if (!response.ok) {
        // If endpoint doesn't exist, show empty list
        if (response.status === 404) {
          setTaxes([])
          setTotalPages(1)
          return
        }
        throw new Error('Failed to load taxes')
      }

      const data: ListResponse = await response.json()
      setTaxes(data.data)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load tax masters')
    } finally {
      setLoading(false)
    }
  }

  function openForm(tax?: TaxMaster) {
    if (tax) {
      setFormData({
        tax_name: tax.tax_name,
        tax_code: tax.tax_code || '',
        tax_rate: String(tax.tax_rate),
        tax_type: tax.tax_type,
        description: tax.description || ''})
      setEditingId(tax.uuid)
    } else {
      setFormData(defaultFormData)
      setEditingId(null)
    }
    setErrors({})
    setShowForm(true)
  }

  async function handleSave() {
    setErrors({})

    if (!formData.tax_name.trim()) {
      setErrors({ tax_name: 'Tax name is required' })
      return
    }

    if (!formData.tax_rate || isNaN(parseFloat(formData.tax_rate))) {
      setErrors({ tax_rate: 'Valid tax rate is required' })
      return
    }

    const taxRate = parseFloat(formData.tax_rate)
    if (taxRate < 0 || taxRate > 100) {
      setErrors({ tax_rate: 'Tax rate must be between 0 and 100' })
      return
    }

    try {
      const submitData = {
        ...formData,
        tax_rate: taxRate}

      const url = editingId
        ? `/api/inventory/settings/taxes/${editingId}`
        : '/api/inventory/settings/taxes'

      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)})

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details)
        }
        throw new Error(result.error || `Failed to ${editingId ? 'update' : 'create'} tax`)
      }

      toast.success(`Tax ${editingId ? 'updated' : 'created'} successfully`)
      setShowForm(false)
      setEditingId(null)
      loadTaxes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving tax')
    }
  }

  async function handleDelete(tax: TaxMaster) {
    if (!deleteConfirm) {
      setDeleteConfirm(tax)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/inventory/settings/taxes/${tax.uuid}`, {
        method: 'DELETE'})

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Tax deleted successfully')
      setDeleteConfirm(null)
      loadTaxes()
    } catch (err) {
      toast.error('Failed to delete tax')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <InventoryPageHeader
        icon={ReceiptText}
        iconColor="text-indigo-600 dark:text-indigo-400"
        bgColor="bg-indigo-100 dark:bg-indigo-950/40"
        title="Tax Master"
        subtitle="Tax configuration"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Percent className="w-8 h-8 text-orange-600" />
            Tax Master
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure tax rates and types</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} /> New Tax
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          placeholder="Search tax masters..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : taxes.length === 0 ? (
          <div className="p-12 text-center">
            <Percent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No tax masters configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Rate (%)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {taxes.map((tax) => (
                  <tr key={tax.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm font-medium">{tax.tax_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                        {TAX_TYPES.find((t) => t.value === tax.tax_type)?.label || tax.tax_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">{tax.tax_code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">{tax.tax_rate}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tax.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {tax.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openForm(tax)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tax)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Tax' : 'New Tax'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Name *</label>
                  <input
                    type="text"
                    value={formData.tax_name}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_name: e.target.value })
                    }
                    placeholder="e.g., 5% GST"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                  {errors.tax_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.tax_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tax Type *</label>
                  <select
                    value={formData.tax_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tax_type: e.target.value as typeof formData.tax_type})
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  >
                    {TAX_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.tax_type && (
                    <p className="text-red-600 text-sm mt-1">{errors.tax_type}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Rate (%) *</label>
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_rate: e.target.value })
                    }
                    placeholder="e.g., 5"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                  {errors.tax_rate && (
                    <p className="text-red-600 text-sm mt-1">{errors.tax_rate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tax Code</label>
                  <input
                    type="text"
                    value={formData.tax_code}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_code: e.target.value })
                    }
                    placeholder="e.g., GST5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold mb-4">Delete Tax?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.tax_name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
