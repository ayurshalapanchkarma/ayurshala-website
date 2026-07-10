'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Loader, RotateCcw } from 'lucide-react'

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

interface Column {
  key: string
  label: string
  render?: (value: any) => React.ReactNode
}

interface MasterListPageProps {
  title: string
  apiBase: string
  columns: Column[]
  onAddClick?: () => void
  onEditClick?: (item: any) => void
  showDeletedColumn?: boolean
  enableRestore?: boolean
  hideHeader?: boolean // Hide the old header entirely
}

export function MasterListPage({
  title,
  apiBase,
  columns,
  onAddClick,
  onEditClick,
  showDeletedColumn = false,
  enableRestore = false,
  hideHeader = false,
}: MasterListPageProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [viewItem, setViewItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    loadItems()
  }, [searchTerm, page])

  async function loadItems() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(showDeletedColumn && { includeDeleted: 'true' }),
      })

      const response = await fetch(`${apiBase}?${params}`)
      if (!response.ok) throw new Error(`Failed to load ${title.toLowerCase()}`)

      const data = await response.json()
      setItems(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${title.toLowerCase()}`)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item: any) {
    setIsDeleting(true)
    try {
      const response = await fetch(`${apiBase}/${item.uuid}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')

      toast.success(`${title.slice(0, -1)} deleted successfully`)
      loadItems()
      setDeleteItem(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to delete ${title.toLowerCase()}`)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRestore(item: any) {
    setIsRestoring(true)
    try {
      const response = await fetch(`${apiBase}/${item.uuid}/restore`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to restore')

      toast.success(`${title.slice(0, -1)} restored successfully`)
      loadItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to restore ${title.toLowerCase()}`)
    } finally {
      setIsRestoring(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {!hideHeader && (
        <>
          {/* Old Header - Hidden when hideHeader is true */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {onAddClick && (
              <button
                onClick={onAddClick}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus size={20} /> Add {title.slice(0, -1)}
              </button>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 rounded-lg"
        />
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="px-6 py-3 text-left font-semibold">
                      {col.label}
                    </th>
                  ))}
                  {showDeletedColumn && <th className="px-6 py-3 text-left font-semibold">Status</th>}
                  <th className="px-6 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {items.map((item) => (
                  <tr
                    key={item.uuid}
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${item.is_deleted ? 'opacity-50' : ''}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 text-gray-900 dark:text-white"
                      >
                        {col.render ? col.render(item[col.key]) : item[col.key] || '-'}
                      </td>
                    ))}
                    {showDeletedColumn && (
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.is_deleted
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : item.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {item.is_deleted ? 'Deleted' : item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setViewItem(item)}
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEditClick?.(item)}
                          className="text-amber-600 hover:text-amber-700 transition"
                        >
                          <Edit size={18} />
                        </button>
                        {enableRestore && item.is_deleted ? (
                          <button
                            onClick={() => handleRestore(item)}
                            disabled={isRestoring}
                            className="text-green-600 hover:text-green-700 transition disabled:opacity-50"
                          >
                            <RotateCcw size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteItem(item)}
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
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">View {title.slice(0, -1)}</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {columns.map((col) => (
                <div key={col.key}>
                  <label className="block text-sm font-medium mb-1">{col.label}</label>
                  <p className="text-gray-900 dark:text-white">
                    {col.render ? col.render(viewItem[col.key]) : viewItem[col.key] || '-'}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setViewItem(null)}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete {title.slice(0, -1)}?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this item?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteItem)}
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
