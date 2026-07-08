'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  X,
  Loader,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface StockAdjustment {
  uuid: string
  adjustment_number: string
  adjustment_date: string
  reason: string
  status: 'draft' | 'approved' | 'cancelled'
  created_at: string
}

interface ListResponse {
  data: StockAdjustment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Product {
  uuid: string
  product_code: string
  product_name: string
  generic_name?: string
}

interface AdjustmentItem {
  product_uuid: string
  batch_uuid?: string
  adjustment_type: 'INCREASE' | 'DECREASE'
  quantity: number
  notes?: string
}

interface Batch {
  uuid: string
  batch_code: string
  available_quantity: number
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusIcons = {
  draft: Clock,
  approved: CheckCircle,
  cancelled: Clock,
}

const reasonOptions = [
  'PHYSICAL_COUNT',
  'DAMAGE',
  'EXPIRED',
  'LOST',
  'CORRECTION',
]

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modal state
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Record<string, Batch[]>>({})
  const [formData, setFormData] = useState({
    adjustment_date: new Date().toISOString().split('T')[0],
    reason: 'PHYSICAL_COUNT' as const,
    notes: '',
  })
  const [items, setItems] = useState<AdjustmentItem[]>([])

  const pageSize = 50

  useEffect(() => {
    fetchAdjustments()
  }, [page, search, status, reason])

  useEffect(() => {
    if (showCreateModal) {
      fetchProducts()
    }
  }, [showCreateModal])

  async function fetchAdjustments() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        status,
        reason,
      })

      const response = await fetch(`/api/inventory/adjustments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setAdjustments(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch adjustments')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch('/api/inventory/products?pageSize=100')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch products')
    }
  }

  async function fetchBatchesForProduct(productUuid: string) {
    try {
      const response = await fetch(`/api/inventory/products/${productUuid}/batches`)
      if (!response.ok) throw new Error('Failed to fetch batches')
      const data = await response.json()
      setBatches(prev => ({
        ...prev,
        [productUuid]: data.data || []
      }))
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch batches')
    }
  }

  async function handleCreateAdjustment() {
    // Validation
    if (!formData.reason) {
      toast.error('Please select a reason')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.product_uuid) {
        toast.error('Please select a product for all items')
        return
      }
      if (!item.batch_uuid) {
        toast.error('Please select a batch for all items')
        return
      }
      if (!item.adjustment_type) {
        toast.error('Please select adjustment type for all items')
        return
      }
      if (item.quantity === 0) {
        toast.error('Please enter a quantity for all items')
        return
      }
    }

    try {
      setSubmitting(true)
      const payload = {
        adjustment_date: formData.adjustment_date,
        reason: formData.reason,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          product_uuid: item.product_uuid,
          batch_uuid: item.batch_uuid,
          adjustment_type: item.adjustment_type,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      }

      const response = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create adjustment')
      }

      toast.success('Stock adjustment created successfully')
      setShowCreateModal(false)
      setFormData({
        adjustment_date: new Date().toISOString().split('T')[0],
        reason: 'PHYSICAL_COUNT',
        notes: '',
      })
      setItems([])
      fetchAdjustments()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to create stock adjustment')
    } finally {
      setSubmitting(false)
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        product_uuid: '',
        batch_uuid: '',
        adjustment_type: 'INCREASE',
        quantity: 0,
        notes: '',
      },
    ])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // When product changes, fetch batches and reset batch selection
    if (field === 'product_uuid' && value) {
      fetchBatchesForProduct(value)
      newItems[index].batch_uuid = ''
    }
    
    setItems(newItems)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock Adjustments</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          New Adjustment
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Stock Adjustment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Adjustment Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason *
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {reasonOptions.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Adjustment Date
                  </label>
                  <input
                    type="date"
                    value={formData.adjustment_date}
                    onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Items *</h3>
                  <button
                    onClick={addItem}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No items added yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Item {index + 1}
                          </label>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Product *
                            </label>
                            <select
                              value={item.product_uuid}
                              onChange={(e) => updateItem(index, 'product_uuid', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.uuid} value={p.uuid}>
                                  {p.product_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {item.product_uuid && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Batch *
                              </label>
                              <select
                                value={item.batch_uuid || ''}
                                onChange={(e) => updateItem(index, 'batch_uuid', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select batch</option>
                                {(batches[item.product_uuid] || []).map((b) => (
                                  <option key={b.uuid} value={b.uuid}>
                                    {b.batch_code} (Available: {b.available_quantity})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type *
                              </label>
                              <select
                                value={item.adjustment_type}
                                onChange={(e) => updateItem(index, 'adjustment_type', e.target.value as any)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="INCREASE">Increase</option>
                                <option value="DECREASE">Decrease</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Qty to adjust"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={item.notes || ''}
                              onChange={(e) => updateItem(index, 'notes', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={2}
                              placeholder="Additional notes for this item"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdjustment}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting && <Loader size={18} className="animate-spin" />}
                {submitting ? 'Creating...' : 'Create Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search adjustment..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Reasons</option>
            <option value="PHYSICAL_COUNT">Physical Count</option>
            <option value="DAMAGE">Damage</option>
            <option value="EXPIRED">Expired</option>
            <option value="LOST">Lost</option>
            <option value="CORRECTION">Correction</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Adjustment #
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No adjustments found
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => {
                  const StatusIcon = statusIcons[adj.status]
                  return (
                    <tr key={adj.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {adj.adjustment_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(adj.adjustment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {adj.reason.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${statusColors[adj.status]}`}>
                          <StatusIcon size={14} />
                          {adj.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
