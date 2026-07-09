'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader, ClipboardList} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

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
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  partially_received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  received: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
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
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)

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

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    supplier_uuid: '',
    order_date: '',
    expected_delivery_date: '',
    remarks: '',
  })
  const [editItems, setEditItems] = useState<POItem[]>([])
  const [editSubmitting, setEditSubmitting] = useState(false)

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

  useEffect(() => {
    if (showEditModal && selectedOrder) {
      // Load the full PO data including items
      loadPOForEdit(selectedOrder.uuid)
      fetchSuppliers()
      fetchProducts()
    }
  }, [showEditModal])

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
      setTotal(data.total)
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

  async function handlePreview(order: PurchaseOrder) {
    setSelectedOrder(order)
    setShowPreviewModal(true)
  }

  async function handleEdit(order: PurchaseOrder) {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  async function handleSubmit(id: string) {
    if (!confirm('Submit this PO for approval?')) return

    setActionInProgress(true)
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${id}/submit`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit')
      }
      
      toast.success('Purchase order submitted for approval')
      fetchOrders()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to submit purchase order')
    } finally {
      setActionInProgress(false)
    }
  }

  async function handleApprove(id: string) {
    if (!confirm('Approve this PO?')) return

    setActionInProgress(true)
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${id}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve')
      }
      
      toast.success('Purchase order approved')
      fetchOrders()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to approve purchase order')
    } finally {
      setActionInProgress(false)
    }
  }

  async function loadPOForEdit(poUuid: string) {
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${poUuid}`)
      if (!response.ok) throw new Error('Failed to fetch PO')
      const po = await response.json()
      
      setEditFormData({
        supplier_uuid: po.supplier_uuid,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date || '',
        remarks: po.remarks || '',
      })
      setEditItems(po.items || [])
    } catch (error) {
      console.error('Error loading PO:', error)
      toast.error('Failed to load PO for editing')
    }
  }

  async function handleSaveEdit() {
    if (!editFormData.supplier_uuid) {
      toast.error('Please select a supplier')
      return
    }
    if (editItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (!selectedOrder) return

    try {
      setEditSubmitting(true)
      const payload = {
        supplier_uuid: editFormData.supplier_uuid,
        order_date: editFormData.order_date,
        expected_delivery_date: editFormData.expected_delivery_date || undefined,
        remarks: editFormData.remarks || undefined,
        items: editItems,
      }

      const response = await fetch(`/api/inventory/purchase-orders/${selectedOrder.uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update purchase order')
      }

      toast.success('Purchase order updated successfully')
      setShowEditModal(false)
      fetchOrders()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to update purchase order')
    } finally {
      setEditSubmitting(false)
    }
  }

  function addEditItem() {
    setEditItems([
      ...editItems,
      {
        product_uuid: '',
        ordered_quantity: 1,
        unit_rate: 0,
        discount_percent: 0,
        gst_percentage: 0,
      },
    ])
  }

  function removeEditItem(index: number) {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  function updateEditItem(index: number, field: string, value: any) {
    const newItems = [...editItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditItems(newItems)
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
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={ClipboardList}
        iconColor="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-100 dark:bg-amber-950/40"
        title="Purchase Orders"
        subtitle="Manage purchase orders"
        onAdd={() => setShowCreateModal(true)}
        addButtonLabel="New Purchase Order"
      />

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
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
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                          <StatusIcon size={14} />
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(order)}
                            className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center dark:border-slate-600 dark:bg-slate-800"
                            title="Preview"
                          >
                            <Eye size={20} className="text-sky-400 hover:text-sky-300" />
                          </button>
                          {order.status === 'draft' && (
                            <button
                              onClick={() => handleEdit(order)}
                              className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center dark:border-slate-600 dark:bg-slate-800"
                              title="Edit"
                            >
                              <Edit2 size={20} className="text-amber-400 hover:text-amber-300" />
                            </button>
                          )}
                          {order.status === 'draft' && (
                            <button
                              onClick={() => handleSubmit(order.uuid)}
                              disabled={actionInProgress}
                              className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
                              title="Submit for Approval"
                            >
                              <CheckCircle size={20} className="text-sky-400 hover:text-sky-300" />
                            </button>
                          )}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(order.uuid)}
                              disabled={actionInProgress}
                              className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
                              title="Approve"
                            >
                              <CheckCircle size={20} className="text-green-500 hover:text-green-400" />
                            </button>
                          )}
                          {order.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(order.uuid)}
                              className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center dark:border-slate-600 dark:bg-slate-800"
                              title="Cancel"
                            >
                              <Trash2 size={20} className="text-red-500 hover:text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4">
          <InventoryPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Order - {selectedOrder.po_number}</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">PO Number</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedOrder.po_number}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Supplier</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedOrder.supplier?.company_name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Order Date</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Expected Delivery</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedOrder.expected_delivery_date ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Amount</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">₹{selectedOrder.total_amount.toFixed(2)}</p>
                </div>
              </div>

              {selectedOrder.remarks && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Remarks</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedOrder.remarks}</p>
                </div>
              )}

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product?.product_name || '-'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.product?.product_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.ordered_quantity} @ ₹{item.unit_rate.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Line: ₹{item.line_amount.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrder && selectedOrder.status === 'draft' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Purchase Order - {selectedOrder.po_number}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Purchase Order Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={editFormData.supplier_uuid}
                    onChange={(e) => setEditFormData({ ...editFormData, supplier_uuid: e.target.value })}
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
                      value={editFormData.order_date}
                      onChange={(e) => setEditFormData({ ...editFormData, order_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.expected_delivery_date}
                      onChange={(e) => setEditFormData({ ...editFormData, expected_delivery_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={editFormData.remarks}
                    onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Items *</h3>
                  <button
                    onClick={addEditItem}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Item
                  </button>
                </div>

                {editItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No items added yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editItems.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Item {index + 1}
                          </label>
                          <button
                            onClick={() => removeEditItem(index)}
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
                              onChange={(e) => updateEditItem(index, 'product_uuid', e.target.value)}
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
                              onChange={(e) => updateEditItem(index, 'ordered_quantity', parseInt(e.target.value) || 0)}
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
                              onChange={(e) => updateEditItem(index, 'unit_rate', parseFloat(e.target.value) || 0)}
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
                              onChange={(e) => updateEditItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
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
                              onChange={(e) => updateEditItem(index, 'gst_percentage', parseFloat(e.target.value) || 0)}
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

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {editSubmitting && <Loader size={18} className="animate-spin" />}
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Non-Draft Message */}
      {showEditModal && selectedOrder && selectedOrder.status !== 'draft' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Purchase Order - {selectedOrder.po_number}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only draft purchase orders can be edited. Current status: <span className="font-semibold">{selectedOrder.status}</span>
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
