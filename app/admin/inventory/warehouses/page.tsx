'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, MapPin, Box } from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'
import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog'

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
  const [total, setTotal] = useState(0)
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
      
      // Map id → uuid since Supabase returns id for UUID primary keys
      const warehouses = data.data.map((w: any) => ({
        ...w,
        uuid: w.uuid || w.id,
      }))
      
      setWarehouses(warehouses)
      setTotalPages(data.totalPages)
      setTotal(data.total)
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

    // STEP 1: Log the warehouse object exactly as received
    const timestamp = new Date().toISOString()
    console.log('%c===== WAREHOUSE DELETE DEBUG [' + timestamp + '] =====', 'background: yellow; color: black; font-weight: bold')
    console.log('Warehouse object:', warehouse)
    console.log('warehouse.id =', (warehouse as any).id)
    console.log('warehouse.uuid =', warehouse.uuid)
    console.log('Object.keys:', Object.keys(warehouse))
    
    // Use uuid since that's what the database actually has
    const deleteUrl = `/api/inventory/warehouses/${warehouse.uuid}`
    console.log('DELETE URL:', deleteUrl)
    console.log('%c===== END WAREHOUSE DELETE DEBUG =====', 'background: yellow; color: black; font-weight: bold')

    setIsDeleting(true)
    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      })

      const result = await response.json()
      console.log('[Delete] API Response:', result)

      if (!response.ok) throw new Error(result.error || 'Failed to delete')

      toast.success('Warehouse deleted successfully')
      setDeleteConfirm(null)
      loadWarehouses()
    } catch (err) {
      console.error('[Delete] Error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete warehouse')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={MapPin}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-950/40"
        title="Warehouses"
        subtitle="Manage warehouse locations"
        onAdd={() => openForm()}
        addButtonLabel="New Warehouse"
      />

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
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {warehouses.map((warehouse) => (
                  <tr key={(warehouse as any).id || warehouse.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm font-medium">{warehouse.warehouse_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {warehouse.address || '-'}
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
        <InventoryPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={pageSize}
          onPageChange={setPage}
        />
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
      <DeleteConfirmationDialog
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.warehouse_name}
        title="Delete Warehouse?"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm)
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
