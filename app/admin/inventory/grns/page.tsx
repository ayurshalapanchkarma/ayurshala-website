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
  X,
  Loader, Receipt} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface GRN {
  uuid: string
  grn_number: string
  purchase_order_uuid?: string
  supplier_uuid: string
  received_date: string
  status: 'draft' | 'posted' | 'cancelled'
  total_amount: number
  created_at: string
  supplier?: { company_name: string }
  purchase_order?: { po_number: string }
  items?: Array<{
    product_uuid: string
    batch_number: string
    received_quantity: number
    product?: { product_name: string }
  }>
}

interface ListResponse {
  data: GRN[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface PurchaseOrder {
  uuid: string
  po_number: string
  supplier_uuid: string
  supplier?: { company_name: string }
}

interface Product {
  uuid: string
  product_code: string
  product_name: string
  generic_name?: string
}

interface GRNItem {
  product_uuid: string
  batch_number: string
  received_quantity: number
  unit_rate?: number
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  posted: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const statusIcons = {
  draft: Clock,
  posted: CheckCircle,
  cancelled: Clock,
}

export default function GRNPage() {
  const [grns, setGRNs] = useState<GRN[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null)

  // Modal state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    purchase_order_uuid: '',
    received_date: new Date().toISOString().split('T')[0],
  })
  const [items, setItems] = useState<GRNItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const pageSize = 20

  useEffect(() => {
    fetchGRNs()
  }, [page, search, status])

  useEffect(() => {
    if (showCreateModal) {
      fetchPurchaseOrders()
      fetchProducts()
    }
  }, [showCreateModal])

  async function fetchGRNs() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        status,
      })

      const response = await fetch(`/api/inventory/grns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setGRNs(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch GRNs')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPurchaseOrders() {
    try {
      const response = await fetch('/api/inventory/purchase-orders?pageSize=100&status=approved')
      if (!response.ok) throw new Error('Failed to fetch purchase orders')
      const data = await response.json()
      setPurchaseOrders(data.data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch purchase orders')
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

  async function handleCreateGRN() {
    if (!formData.purchase_order_uuid && items.length === 0) {
      toast.error('Please select a purchase order or add items')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setSubmitting(true)
      
      // Get supplier_uuid from selected PO
      let supplierUuid: string | undefined = undefined
      if (formData.purchase_order_uuid) {
        const selectedPO = purchaseOrders.find(po => po.uuid === formData.purchase_order_uuid)
        supplierUuid = selectedPO?.supplier_uuid
      }

      if (!supplierUuid) {
        toast.error('Cannot determine supplier. Please select a valid purchase order.')
        setSubmitting(false)
        return
      }

      const payload = {
        purchase_order_uuid: formData.purchase_order_uuid || undefined,
        supplier_uuid: supplierUuid,
        received_date: formData.received_date,
        items: items,
      }

      const response = await fetch('/api/inventory/grns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create GRN')
      }

      toast.success('GRN created successfully')
      setShowCreateModal(false)
      setFormData({
        purchase_order_uuid: '',
        received_date: new Date().toISOString().split('T')[0],
      })
      setItems([])
      fetchGRNs()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to create GRN')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return

    try {
      const response = await fetch(`/api/inventory/grns/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')
      toast.success('GRN cancelled')
      fetchGRNs()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to cancel GRN')
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        product_uuid: '',
        batch_number: '',
        received_quantity: 0,
        unit_rate: 0,
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
        icon={Receipt}
        iconColor="text-teal-600 dark:text-teal-400"
        bgColor="bg-teal-100 dark:bg-teal-950/40"
        title="GRN"
        subtitle="Goods Receipt Notes"
        onAdd={() => setShowCreateModal(true)}
        addButtonLabel="New GRN"
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Goods Receipt Note</h2>
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
                <h3 className="font-semibold text-gray-900 dark:text-white">GRN Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Order
                  </label>
                  <select
                    value={formData.purchase_order_uuid}
                    onChange={(e) => setFormData({ ...formData, purchase_order_uuid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a purchase order (optional)</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.uuid} value={po.uuid}>
                        {po.po_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Received Date
                  </label>
                  <input
                    type="date"
                    value={formData.received_date}
                    onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Received Items *</h3>
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
                              Batch Number *
                            </label>
                            <input
                              type="text"
                              value={item.batch_number}
                              onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Batch/Lot number"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Received Qty *
                            </label>
                            <input
                              type="number"
                              value={item.received_quantity}
                              onChange={(e) => updateItem(index, 'received_quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Unit Rate
                            </label>
                            <input
                              type="number"
                              value={item.unit_rate || 0}
                              onChange={(e) => updateItem(index, 'unit_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                              min="0"
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
                onClick={handleCreateGRN}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting && <Loader size={18} className="animate-spin" />}
                {submitting ? 'Creating...' : 'Create GRN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search GRN number..."
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
            <option value="posted">Posted</option>
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
                  GRN Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Received Date
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : grns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No GRNs found
                  </td>
                </tr>
              ) : (
                grns.map((grn) => {
                  const StatusIcon = statusIcons[grn.status]
                  return (
                    <tr key={grn.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {grn.grn_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {grn.supplier?.company_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {grn.purchase_order?.po_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(grn.received_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        ₹{grn.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${statusColors[grn.status]}`}>
                          <StatusIcon size={14} />
                          {grn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => setSelectedGRN(grn)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>
                        {grn.status === 'draft' && (
                          <button
                            onClick={() => setSelectedGRN(grn)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {grn.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(grn.uuid)}
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
    </div>
  )
}
