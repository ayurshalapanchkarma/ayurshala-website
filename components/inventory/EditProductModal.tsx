'use client'

import { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface EditProductModalProps {
  isOpen: boolean
  productUuid: string | null
  onClose: () => void
  onSuccess: () => void
}

interface Product {
  uuid: string
  product_code: string
  product_name: string
  generic_name: string
  sku: string
  description: string
  minimum_stock: number
  reorder_level: number
  maximum_stock: number
  purchase_price: number
  selling_price: number
  mrp: number
  gst_percentage: number
}

export default function EditProductModal({
  isOpen,
  productUuid,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>({})

  console.log(`[EditProductModal] Rendering with isOpen=${isOpen}, productUuid=${productUuid}`)

  useEffect(() => {
    if (!isOpen || !productUuid) {
      setProduct(null)
      setFormData({})
      setError(null)
      return
    }

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log(`[EditProductModal] Fetching product: ${productUuid}`)

        const response = await fetch(`/api/inventory/products/${productUuid}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch product (${response.status})`)
        }

        const data = await response.json()
        console.log(`[EditProductModal] Product fetched:`, data)
        setProduct(data)
        setFormData({
          product_name: data.product_name,
          generic_name: data.generic_name,
          description: data.description,
          minimum_stock: data.minimum_stock,
          reorder_level: data.reorder_level,
          maximum_stock: data.maximum_stock,
          purchase_price: data.purchase_price,
          selling_price: data.selling_price,
          mrp: data.mrp,
          gst_percentage: data.gst_percentage,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load product'
        console.error(`[EditProductModal] Error:`, err)
        setError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [isOpen, productUuid])

  const handleSave = async () => {
    if (!product?.uuid) return

    try {
      setSaving(true)
      setError(null)
      console.log(`[EditProductModal] Saving product:`, formData)

      const response = await fetch(`/api/inventory/products/${product.uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to save product (${response.status})`)
      }

      const data = await response.json()
      console.log(`[EditProductModal] Product saved successfully:`, data)
      toast.success('Product updated successfully')
      onSuccess()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save product'
      console.error(`[EditProductModal] Save error:`, err)
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Product
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader size={32} className="animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : product ? (
              <div className="space-y-4">
                {/* Product Code (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Code
                  </label>
                  <input
                    type="text"
                    value={product.product_code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        product_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Generic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    value={formData.generic_name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        generic_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Stock Levels - Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minimum_stock || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimum_stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={formData.reorder_level || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reorder_level: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Stock
                    </label>
                    <input
                      type="number"
                      value={formData.maximum_stock || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maximum_stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Pricing - Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purchase Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selling_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      MRP
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.mrp || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mrp: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* GST */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GST Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gst_percentage || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gst_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 p-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !product}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {saving && <Loader size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
