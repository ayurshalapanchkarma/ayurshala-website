'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Package} from 'lucide-react'
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

interface Product {
  uuid: string
  product_code: string
  barcode?: string
  product_name: string
  generic_name?: string
  category_uuid?: string
  manufacturer_uuid?: string
  unit_uuid?: string
  default_supplier_uuid?: string
  purchase_price?: number
  selling_price?: number
  mrp?: number
  gst_rate?: number
  hsn_code?: string
  min_stock?: number
  reorder_level?: number
  max_stock?: number
  batch_tracking: boolean
  expiry_tracking: boolean
  warehouse?: string
  rack?: string
  shelf?: string
  bin?: string
  description?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface Category {
  uuid: string
  name: string
}

interface Unit {
  uuid: string
  name: string
}

interface Manufacturer {
  uuid: string
  manufacturer_name: string
}

interface Supplier {
  uuid: string
  company_name: string
}

interface ListResponse {
  data: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dropdowns, setDropdowns] = useState({
    categories: [] as Category[],
    units: [] as Unit[],
    manufacturers: [] as Manufacturer[],
    suppliers: [] as Supplier[],
  })
  const pageSize = 10

  const [formData, setFormData] = useState({
    product_name: '',
    generic_name: '',
    barcode: '',
    category_uuid: '',
    manufacturer_uuid: '',
    unit_uuid: '',
    default_supplier_uuid: '',
    purchase_price: '',
    selling_price: '',
    mrp: '',
    gst_rate: '',
    hsn_code: '',
    min_stock: '',
    reorder_level: '',
    max_stock: '',
    batch_tracking: false,
    expiry_tracking: false,
    warehouse: '',
    rack: '',
    shelf: '',
    bin: '',
    description: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadDropdowns()
    loadProducts()
  }, [searchTerm, page])

  async function loadDropdowns() {
    try {
      const [catRes, unitRes, mfrRes, supRes] = await Promise.all([
        fetch('/api/inventory/categories?pageSize=1000'),
        fetch('/api/inventory/units?pageSize=1000'),
        fetch('/api/inventory/manufacturers?pageSize=1000'),
        fetch('/api/inventory/suppliers?pageSize=1000'),
      ])

      if (catRes.ok) {
        const catData = await catRes.json()
        console.log('[Categories API] Status OK, data:', catData)
        setDropdowns(prev => ({ ...prev, categories: catData.data || [] }))
      } else {
        console.error('[Categories API] Error status:', catRes.status, catRes.statusText)
        const errorData = await catRes.json().catch(() => ({}))
        console.error('[Categories API] Error response:', errorData)
      }

      if (unitRes.ok) {
        const unitData = await unitRes.json()
        console.log('[Units API] Status OK, data:', unitData)
        setDropdowns(prev => ({ ...prev, units: unitData.data || [] }))
      } else {
        console.error('[Units API] Error status:', unitRes.status, unitRes.statusText)
        const errorData = await unitRes.json().catch(() => ({}))
        console.error('[Units API] Error response:', errorData)
      }

      if (mfrRes.ok) {
        const mfrData = await mfrRes.json()
        console.log('[Manufacturers API] Status OK, data:', mfrData)
        setDropdowns(prev => ({ ...prev, manufacturers: mfrData.data || [] }))
      } else {
        console.error('[Manufacturers API] Error status:', mfrRes.status, mfrRes.statusText)
        const errorData = await mfrRes.json().catch(() => ({}))
        console.error('[Manufacturers API] Error response:', errorData)
      }

      if (supRes.ok) {
        const supData = await supRes.json()
        console.log('[Suppliers API] Status OK, data:', supData)
        setDropdowns(prev => ({ ...prev, suppliers: supData.data || [] }))
      } else {
        console.error('[Suppliers API] Error status:', supRes.status, supRes.statusText)
        const errorData = await supRes.json().catch(() => ({}))
        console.error('[Suppliers API] Error response:', errorData)
      }
    } catch (err) {
      console.error('Failed to load dropdown data - Network error:', err)
      toast.error('Failed to load dropdown data. Check console for details.')
    }
  }

  async function loadProducts() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await fetch(`/api/inventory/products?${params}`)
      if (!response.ok) throw new Error('Failed to load products')

      const data: ListResponse = await response.json()
      setProducts(data.data)
      setTotalPages(data.totalPages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setErrors({})

      const url = editingId
        ? `/api/inventory/products/${editingId}`
        : '/api/inventory/products'

      const method = editingId ? 'PUT' : 'POST'

      // Convert string numbers to actual numbers and map field names to backend schema
      const submitData = {
        product_name: formData.product_name,
        generic_name: formData.generic_name || undefined,
        barcode: formData.barcode || undefined,
        category_uuid: formData.category_uuid,
        manufacturer_uuid: formData.manufacturer_uuid || undefined,
        unit_uuid: formData.unit_uuid,
        default_supplier_uuid: formData.default_supplier_uuid || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,  // Default to 0 instead of undefined
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : 0,   // Default to 0 instead of undefined
        mrp: formData.mrp ? parseFloat(formData.mrp) : 0,                                  // Default to 0 instead of undefined
        gst_percentage: formData.gst_rate ? parseFloat(formData.gst_rate) : 0,             // Default to 0 instead of undefined
        hsn_code: formData.hsn_code || undefined,
        minimum_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,             // Default to 0 instead of undefined
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : 0,    // Default to 0 instead of undefined
        maximum_stock: formData.max_stock ? parseInt(formData.max_stock) : undefined,
        batch_tracking: formData.batch_tracking,
        expiry_tracking: formData.expiry_tracking,
        storage_location: formData.warehouse || undefined,
        rack_number: formData.rack || undefined,
        shelf_number: formData.shelf || undefined,
        bin_number: formData.bin || undefined,
        description: formData.description || undefined,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details)
          // Show first validation error in toast
          const firstError = Object.values(result.details)[0] as string
          throw new Error(firstError || result.error)
        }
        throw new Error(result.error || `Failed to ${editingId ? 'update' : 'create'} product`)
      }

      toast.success(`Product ${editingId ? 'updated' : 'created'} successfully`)
      setShowForm(false)
      setEditingId(null)
      setFormData({
        product_name: '',
        generic_name: '',
        barcode: '',
        category_uuid: '',
        manufacturer_uuid: '',
        unit_uuid: '',
        default_supplier_uuid: '',
        purchase_price: '',
        selling_price: '',
        mrp: '',
        gst_rate: '',
        hsn_code: '',
        min_stock: '',
        reorder_level: '',
        max_stock: '',
        batch_tracking: false,
        expiry_tracking: false,
        warehouse: '',
        rack: '',
        shelf: '',
        bin: '',
        description: '',
      })
      loadProducts()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[Product Save Error]', { error: err, message: errorMsg })
      toast.error(errorMsg || 'Failed to save product')
    }
  }

  async function handleDelete(product: Product) {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/inventory/products/${product.uuid}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Product deleted successfully')
      loadProducts()
      setDeleteConfirm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleEdit(product: Product) {
    setFormData({
      product_name: product.product_name,
      generic_name: product.generic_name || '',
      barcode: product.barcode || '',
      category_uuid: product.category_uuid || '',
      manufacturer_uuid: product.manufacturer_uuid || '',
      unit_uuid: product.unit_uuid || '',
      default_supplier_uuid: product.default_supplier_uuid || '',
      purchase_price: product.purchase_price?.toString() || '',
      selling_price: product.selling_price?.toString() || '',
      mrp: product.mrp?.toString() || '',
      gst_rate: product.gst_rate?.toString() || '',
      hsn_code: product.hsn_code || '',
      min_stock: product.min_stock?.toString() || '',
      reorder_level: product.reorder_level?.toString() || '',
      max_stock: product.max_stock?.toString() || '',
      batch_tracking: product.batch_tracking || false,
      expiry_tracking: product.expiry_tracking || false,
      warehouse: product.warehouse || '',
      rack: product.rack || '',
      shelf: product.shelf || '',
      bin: product.bin || '',
      description: product.description || '',
    })
    setEditingId(product.uuid)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingId(null)
    setErrors({})
    setFormData({
      product_name: '',
      generic_name: '',
      barcode: '',
      category_uuid: '',
      manufacturer_uuid: '',
      unit_uuid: '',
      default_supplier_uuid: '',
      purchase_price: '',
      selling_price: '',
      mrp: '',
      gst_rate: '',
      hsn_code: '',
      min_stock: '',
      reorder_level: '',
      max_stock: '',
      batch_tracking: false,
      expiry_tracking: false,
      warehouse: '',
      rack: '',
      shelf: '',
      bin: '',
      description: '',
    })
  }

  if (loading && products.length === 0) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <InventoryPageHeader
        icon={Package}
        iconColor="text-sky-600 dark:text-sky-400"
        bgColor="bg-sky-100 dark:bg-sky-950/40"
        title="Products"
        subtitle="Manage inventory products"
        onAdd={() => {
          setShowForm(true)
          setEditingId(null)
          setErrors({})
        }}
        addButtonLabel="Add Product"
      />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Generic</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">MRP</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {products.map((product) => (
              <tr key={product.uuid} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{product.product_code}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{product.product_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{product.generic_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">₹{product.mrp}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                {editingId ? 'Edit' : 'Add'} Product
              </h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className={`w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                      errors.product_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.product_name && <p className="text-xs text-red-600 mt-0.5">{errors.product_name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category_uuid}
                    onChange={(e) => setFormData({ ...formData, category_uuid: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  >
                    <option value="">Select Category</option>
                    {dropdowns.categories.map((cat) => (
                      <option key={cat.uuid} value={cat.uuid}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
                  <select
                    value={formData.manufacturer_uuid}
                    onChange={(e) => setFormData({ ...formData, manufacturer_uuid: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  >
                    <option value="">Select Manufacturer</option>
                    {dropdowns.manufacturers.map((mfr) => (
                      <option key={mfr.uuid} value={mfr.uuid}>{mfr.manufacturer_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <select
                    value={formData.unit_uuid}
                    onChange={(e) => setFormData({ ...formData, unit_uuid: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  >
                    <option value="">Select Unit</option>
                    {dropdowns.units.map((unit) => (
                      <option key={unit.uuid} value={unit.uuid}>{unit.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Supplier</label>
                  <select
                    value={formData.default_supplier_uuid}
                    onChange={(e) => setFormData({ ...formData, default_supplier_uuid: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  >
                    <option value="">Select Supplier</option>
                    {dropdowns.suppliers.map((sup) => (
                      <option key={sup.uuid} value={sup.uuid}>{sup.company_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pricing</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['purchase_price', 'selling_price', 'mrp', 'gst_rate'].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                        {field.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData[field as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Stock Levels</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['min_stock', 'reorder_level', 'max_stock'].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                        {field.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="number"
                        value={formData[field as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Warehouse */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Warehouse Location</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['warehouse', 'rack', 'shelf', 'bin'].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">{field}</label>
                      <input
                        type="text"
                        value={formData[field as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.batch_tracking}
                    onChange={(e) => setFormData({ ...formData, batch_tracking: e.target.checked })}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Batch Tracking</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.expiry_tracking}
                    onChange={(e) => setFormData({ ...formData, expiry_tracking: e.target.checked })}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Expiry Tracking</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-white rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delete Product?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {deleteConfirm.product_name}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
