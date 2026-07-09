'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Truck} from 'lucide-react'
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

interface Supplier {
  uuid: string
  supplier_code: string
  company_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  pan?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface ListResponse {
  data: Supplier[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const pageSize = 10

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    gst_number: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    payment_terms: '',
    credit_days: '',
    bank_name: '',
    account_number: '',
    ifsc: '',
    upi_id: '',
    opening_balance: '',
    credit_limit: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSuppliers()
  }, [searchTerm, page])

  async function loadSuppliers() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await fetch(`/api/inventory/suppliers?${params}`)
      if (!response.ok) throw new Error('Failed to load suppliers')

      const data: ListResponse = await response.json()
      setSuppliers(data.data)
      setTotalPages(data.totalPages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setErrors({})

      const url = editingId
        ? `/api/inventory/suppliers/${editingId}`
        : '/api/inventory/suppliers'

      const method = editingId ? 'PUT' : 'POST'

      // Convert string numbers to actual numbers
      const submitData = {
        ...formData,
        credit_days: formData.credit_days ? parseInt(formData.credit_days) : undefined,
        opening_balance: formData.opening_balance ? parseFloat(formData.opening_balance) : undefined,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
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
        }
        throw new Error(result.error || `Failed to ${editingId ? 'update' : 'create'} supplier`)
      }

      toast.success(`Supplier ${editingId ? 'updated' : 'created'} successfully`)
      setShowForm(false)
      setEditingId(null)
      setFormData({
        company_name: '',
        contact_person: '',
        mobile: '',
        email: '',
        gst_number: '',
        pan: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        payment_terms: '',
        credit_days: '',
        bank_name: '',
        account_number: '',
        ifsc: '',
        upi_id: '',
        opening_balance: '',
        credit_limit: '',
      })
      loadSuppliers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save supplier')
    }
  }

  async function handleDelete(supplier: Supplier) {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/inventory/suppliers/${supplier.uuid}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Supplier deleted successfully')
      loadSuppliers()
      setDeleteConfirm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete supplier')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleEdit(supplier: Supplier) {
    setFormData({
      company_name: supplier.company_name,
      contact_person: supplier.contact_person || '',
      mobile: supplier.mobile || '',
      email: supplier.email || '',
      gst_number: supplier.gst_number || '',
      pan: supplier.pan || '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      payment_terms: '',
      credit_days: '',
      bank_name: '',
      account_number: '',
      ifsc: '',
      upi_id: '',
      opening_balance: '',
      credit_limit: '',
    })
    setEditingId(supplier.uuid)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingId(null)
    setErrors({})
    setFormData({
      company_name: '',
      contact_person: '',
      mobile: '',
      email: '',
      gst_number: '',
      pan: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      payment_terms: '',
      credit_days: '',
      bank_name: '',
      account_number: '',
      ifsc: '',
      upi_id: '',
      opening_balance: '',
      credit_limit: '',
    })
  }

  if (loading && suppliers.length === 0) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <InventoryPageHeader
        icon={Truck}
        iconColor="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-100 dark:bg-emerald-950/40"
        title="Suppliers"
        subtitle="Manage suppliers"
        onAdd={() => {
          setShowForm(true)
          setEditingId(null)
          setErrors({})
        }}
        addButtonLabel="Add Supplier"
      />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search suppliers..."
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Company</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Contact</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {suppliers.map((supplier) => (
              <tr key={supplier.uuid} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{supplier.supplier_code}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{supplier.company_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{supplier.contact_person}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{supplier.email}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(supplier)}
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
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                {editingId ? 'Edit' : 'Add'} Supplier
              </h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {Object.keys(formData).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <input
                    type={
                      field === 'email' ? 'email' :
                      field === 'mobile' ? 'tel' :
                      field.includes('balance') || field.includes('limit') ? 'number' :
                      field === 'credit_days' ? 'number' :
                      'text'
                    }
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field]: e.target.value,
                      })
                    }
                    className={`w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                      errors[field] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[field] && <p className="text-xs text-red-600 mt-0.5">{errors[field]}</p>}
                </div>
              ))}
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delete Supplier?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {deleteConfirm.company_name}?
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
