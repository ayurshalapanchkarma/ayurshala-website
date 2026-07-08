'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, MapPin, Box } from 'lucide-react'
import { toast } from 'sonner'

interface Warehouse {
  uuid: string
  warehouse_name: string
  address?: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  is_deleted: boolean
}

interface ListResponse {
  data: Warehouse[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const defaultFormData = {
  warehouse_name: '',
  address: '',
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Warehouse | null>(null)

  const pageSize = 10

  useEffect(() => {
    loadWarehouses()
  }, [page, search])

  async function loadWarehouses() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await fetch(`/api/inventory/warehouses?${params}`)
      if (!response.ok) throw new Error('Failed to load warehouses')

      const data: ListResponse = await response.json()
      console.log('[Warehouses] Loaded:', data.data)
      setWarehouses(data.data)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }

  function openForm(warehouse?: Warehouse) {
    if (warehouse) {
      setFormData({
        warehouse_name: warehouse.warehouse_name,
        address: warehouse.address || '',
      })
      setEditingId(warehouse.uuid)
    } else {
      setFormData(defaultFormData)
      setEditingId(null)
    }
    setErrors({})
    setShowForm(true)
  }

  async function handleSave() {
    setErrors({})

    if (!formData.warehouse_name.trim()) {
      setErrors({ warehouse_name: 'Warehouse name is required' })
      return
    }

    try {
      const url = editingId
        ? `/api/inventory/warehouses/${editingId}`
        : '/api/inventory/warehouses'

      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details)
        }
        throw new Error(result.error || `Failed to ${editingId ? 'update' : 'create'} warehouse`)
      }

      toast.success(`Warehouse ${editingId ? 'updated' : 'created'} successfully`)
      setShowForm(false)
      setEditingId(null)
      loadWarehouses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving warehouse')
    }
  }

  async function handleDelete(warehouse: Warehouse) {
    if (!deleteConfirm) {
      setDeleteConfirm(warehouse)
      return
    }

    console.log('[Delete] Deleting warehouse:', warehouse.uuid, warehouse)

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/inventory/warehouses/${warehouse.uuid}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      console.log('[Delete] Response:', result)

      if (!response.ok) throw new Error(result.error || 'Failed to delete')

      toast.success('Warehouse deleted successfully')
      setDeleteConfirm(null)
      loadWarehouses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete warehouse')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-8 h-8 text-orange-600" />
            Warehouses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage inventory warehouse locations</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} /> New Warehouse
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          placeholder="Search warehouses..."
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
        ) : warehouses.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No warehouses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm font-mono">{warehouse.warehouse_code}</td>
                    <td className="px-6 py-4 text-sm font-medium">{warehouse.warehouse_name}</td>
                    <td className="px-6 py-4 text-sm">
                      {warehouse.city || warehouse.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {warehouse.phone || warehouse.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          warehouse.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openForm(warehouse)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(warehouse)}
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
                {editingId ? 'Edit Warehouse' : 'New Warehouse'}
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
                  <label className="block text-sm font-medium mb-2">Warehouse Code</label>
                  <input
                    type="text"
                    value={formData.warehouse_code}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse_code: e.target.value })
                    }
                    placeholder="e.g., WH001"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                  {errors.warehouse_code && (
                    <p className="text-red-600 text-sm mt-1">{errors.warehouse_code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Warehouse Name *</label>
                  <input
                    type="text"
                    value={formData.warehouse_name}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse_name: e.target.value })
                    }
                    placeholder="e.g., Main Warehouse"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                  {errors.warehouse_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.warehouse_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Building A"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                  {errors.location && (
                    <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    placeholder="Postal code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_person: e.target.value })
                    }
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
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
            <h3 className="text-lg font-bold mb-4">Delete Warehouse?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.warehouse_name}"? This action cannot be undone.
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
