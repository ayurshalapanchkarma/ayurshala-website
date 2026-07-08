'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader,
} from 'lucide-react'
import { toast } from 'sonner'

interface PurchaseOrder {
  uuid: string
  po_number: string
  supplier_uuid: string
  status: 'draft' | 'pending' | 'approved' | 'partially_received' | 'received' | 'cancelled'
  order_date: string
  expected_delivery_date?: string
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  created_at: string
  supplier?: { company_name: string }
}

interface ListResponse {
  data: PurchaseOrder[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Supplier {
  uuid: string
  company_name: string
  supplier_code: string
}

interface Product {
  uuid: string
  product_code: string
  product_name: string
  generic_name?: string
  unit?: { name: string; short_name: string }
}

interface POItem {
  product_uuid: string
  ordered_quantity: number
  unit_rate: number
  discount_percent?: number
  gst_percentage?: number
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  pending: 'bg-blue-100 text-blue-800 border-blue-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  partially_received: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  received: 'bg-purple-100 text-purple-800 border-purple-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const statusIcons = {
  draft: Clock,
  pending: AlertCircle,
  approved: CheckCircle,
  partially_received: Clock,
  received: CheckCircle,
  cancelled: AlertCircle,
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)

  // Modal form state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    supplier_uuid: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    remarks: '',
  })
  const [items, setItems] = useState<POItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const pageSize = 20

  useEffect(() => {
    fetchOrders()
  }, [page, search, status])

  useEffect(() => {
    if (showCreateModal) {
      fetchSuppliers()
      fetchProducts()
    }
  }, [showCreateModal])

  async function fetchOrders() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        status,
      })

      const response = await fetch(`/api/inventory/purchase-orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setOrders(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch purchase orders')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSuppliers() {
    try {
      const response = await fetch('/api/inventory/suppliers?pageSize=100')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      const data = await response.json()
      setSuppliers(data.data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch suppliers')
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

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Purchase order cancelled')
      fetchOrders()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to cancel purchase order')
    }
  }

  async function handleCreatePO() {
    // Validation
    if (!formData.supplier_uuid) {
      toast.error('Please select a supplier')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        supplier_uuid: formData.supplier_uuid,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        remarks: formData.remarks || undefined,
        items: items,
      }

      const response = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create purchase order')
      }

      toast.success('Purchase order created successfully')
      setShowCreateModal(false)
      setFormData({
        supplier_uuid: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        remarks: '',
      })
      setItems([])
      fetchOrders()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to create purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        product_uuid: '',
        ordered_quantity: 1,
        unit_rate: 0,
        discount_percent: 0,
        gst_percentage: 0,
      },
    ])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          New Purchase Order
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Purchase Order</h2>
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
                <h3 className="font-semibold text-gray-900 dark:text-white">Purchase Order Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplier_uuid}
                    onChange={(e) => setFormData({ ...formData, supplier_uuid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.company_name} ({s.supplier_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order Date
                    </label>
                    <input
                      type="date"
                      value={formData.order_date}
                      onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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

                        <div className="grid grid-cols-2 gap-3">
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
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              value={item.ordered_quantity}
                              onChange={(e) => updateItem(index, 'ordered_quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Unit Rate *
                            </label>
                            <input
                              type="number"
                              value={item.unit_rate}
                              onChange={(e) => updateItem(index, 'unit_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Discount %
                            </label>
                            <input
                              type="number"
                              value={item.discount_percent || 0}
                              onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              GST %
                            </label>
                            <input
                              type="number"
                              value={item.gst_percentage || 0}
                              onChange={(e) => updateItem(index, 'gst_percentage', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Line Amount
                            </label>
                            <input
                              type="text"
                              value={`₹${(
                                item.ordered_quantity *
                                item.unit_rate *
                                (1 - (item.discount_percent || 0) / 100) *
                                (1 + (item.gst_percentage || 0) / 100)
                              ).toFixed(2)}`}
                              disabled
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600"
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
                onClick={handleCreatePO}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting && <Loader size={18} className="animate-spin" />}
                {submitting ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search PO number..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
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
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Order Date
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Amount
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const StatusIcon = statusIcons[order.status]
                  return (
                    <tr key={order.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {order.po_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {order.supplier?.company_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        ₹{order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${statusColors[order.status]}`}>
                          <StatusIcon size={14} />
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === 'draft' && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {order.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(order.uuid)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
