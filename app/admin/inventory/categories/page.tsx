'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Loader, RotateCcw, Tags} from 'lucide-react'
import Link from 'next/link'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

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

interface Category {
  uuid: string
  name: string
  description?: string
  display_order: number
  color?: string
  icon?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface ListResponse {
  data: Category[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [viewModal, setViewModal] = useState<Category | null>(null)
  const [editModal, setEditModal] = useState<Category | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', display_order: 0 })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadCategories()
  }, [debouncedSearch, page])

  async function loadCategories() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: 'display_order',
        sortOrder: 'asc',
        includeDeleted: 'true',
      })

      const response = await fetch(`/api/inventory/categories?${params}`)
      if (!response.ok) throw new Error('Failed to load categories')

      const data: ListResponse = await response.json()
      setCategories(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(category: Category) {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/inventory/categories/${category.uuid}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Category deleted successfully')
      loadCategories()
      setShowDeleteConfirm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRestore(category: Category) {
    setIsRestoring(true)
    try {
      const response = await fetch(`/api/inventory/categories/${category.uuid}/restore`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to restore')

      toast.success('Category restored successfully')
      loadCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore category')
    } finally {
      setIsRestoring(false)
    }
  }

  async function handleStatusToggle(category: Category) {
    try {
      const response = await fetch(`/api/inventory/categories/${category.uuid}/toggle-status`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to toggle status')

      toast.success(category.is_active ? 'Category deactivated' : 'Category activated')
      loadCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle status')
    }
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      const url = editModal ? `/api/inventory/categories/${editModal.uuid}` : '/api/inventory/categories'
      const method = editModal ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.details?.[Object.keys(errData.details)[0]] || errData.error)
      }

      toast.success(editModal ? 'Category updated' : 'Category created')
      setEditModal(null)
      setFormData({ name: '', description: '', display_order: 0 })
      loadCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={Tags}
        iconColor="text-violet-600 dark:text-violet-400"
        bgColor="bg-violet-100 dark:bg-violet-950/40"
        title="Categories"
        subtitle="Manage product categories"
        onAdd={() => {
          setFormData({ name: '', description: '', display_order: 0 })
          setEditModal({} as any)
        }}
        addButtonLabel="Add Category"
      />

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="flex-1 bg-transparent outline-none text-sm dark:text-white"
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No categories found</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Description</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {categories.map((cat) => (
                  <tr
                    key={cat.uuid}
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${
                      cat.is_deleted ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{cat.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cat.is_deleted
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : cat.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {cat.is_deleted ? 'Deleted' : cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setViewModal(cat)}
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setFormData({
                              name: cat.name,
                              description: cat.description || '',
                              display_order: cat.display_order,
                            })
                            setEditModal(cat)
                          }}
                          className="text-amber-600 hover:text-amber-700 transition"
                        >
                          <Edit size={18} />
                        </button>
                        {cat.is_deleted ? (
                          <button
                            onClick={() => handleRestore(cat)}
                            disabled={isRestoring}
                            className="text-green-600 hover:text-green-700 transition disabled:opacity-50"
                          >
                            <RotateCcw size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(cat)}
                            className="text-red-600 hover:text-red-700 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg disabled:opacity-50 text-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 text-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">View Category</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <p className="text-gray-900 dark:text-white">{viewModal.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <p className="text-gray-900 dark:text-white">{viewModal.description || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <p className="text-gray-900 dark:text-white">
                  {viewModal.is_deleted ? 'Deleted' : viewModal.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewModal(null)}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">{editModal.uuid ? 'Edit' : 'Add'} Category</h2>
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
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditModal(null)
                  setFormData({ name: '', description: '', display_order: 0 })
                }}
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Category?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
