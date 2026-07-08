'use client'

import { useState, useEffect } from 'react'
import { X, Edit, FileText, Loader } from 'lucide-react'

interface ProductPreviewModalProps {
  productUuid: string | null
  isOpen: boolean
  onClose: () => void
  onEdit: (productUuid: string) => void
}

interface ProductData {
  uuid: string
  product_code: string
  sku: string | null
  barcode: string | null
  product_name: string
  generic_name: string | null
  category_name?: string
  unit?: string
  manufacturer_name?: string
  company_name?: string
  purchase_price: number
  selling_price: number
  mrp: number
  gst_percentage: number
  hsn_code: string | null
  minimum_stock: number
  reorder_level: number
  maximum_stock: number | null
  storage_location: string | null
  rack_number: string | null
  shelf_number: string | null
  bin_number: string | null
  available_qty?: number
  batch_tracking: boolean
  expiry_tracking: boolean
  is_prescription: boolean
  is_consumable: boolean
  is_service_item: boolean
  description: string | null
}

export default function ProductPreviewModal({ productUuid, isOpen, onClose, onEdit }: ProductPreviewModalProps) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stockMovements, setStockMovements] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && productUuid) {
      loadProductData()
    }
  }, [isOpen, productUuid])

  const loadProductData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(`[ProductPreviewModal] Loading product: ${productUuid}`)
      const response = await fetch(`/api/inventory/products/${productUuid}`)

      if (!response.ok) {
        throw new Error(`Failed to load product: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`[ProductPreviewModal] Product loaded:`, data)
      setProduct(data)

      // Try to load stock movements
      loadStockMovements()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load product'
      console.error(`[ProductPreviewModal] Error:`, err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadStockMovements = async () => {
    try {
      // This would fetch the last 10 stock movements for the product
      // For now, we'll leave it as a placeholder since we don't have a movements API yet
      console.log(`[ProductPreviewModal] Stock movements not yet available`)
    } catch (err) {
      console.error(`[ProductPreviewModal] Error loading movements:`, err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-end md:items-center md:justify-end">
      <div className="bg-white dark:bg-slate-800 w-full md:w-96 max-h-[90vh] md:max-h-[95vh] md:max-w-2xl overflow-y-auto rounded-t-lg md:rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Product Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin text-blue-600" size={32} />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading product...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {product && !loading && (
            <>
              {/* Basic Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Product Code</p>
                    <p className="font-mono text-slate-900 dark:text-white">{product.product_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">SKU</p>
                    <p className="font-mono text-slate-900 dark:text-white">{product.sku || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Barcode</p>
                    <p className="font-mono text-slate-900 dark:text-white text-xs">{product.barcode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Product Name</p>
                    <p className="text-slate-900 dark:text-white">{product.product_name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 dark:text-gray-400">Category</p>
                    <p className="text-slate-900 dark:text-white">{product.category_name || '—'}</p>
                  </div>
                  {product.generic_name && (
                    <div className="col-span-2">
                      <p className="text-gray-600 dark:text-gray-400">Generic Name</p>
                      <p className="text-slate-900 dark:text-white">{product.generic_name}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Specifications */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Unit</p>
                    <p className="text-slate-900 dark:text-white">{product.unit || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Manufacturer</p>
                    <p className="text-slate-900 dark:text-white">{product.manufacturer_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">HSN Code</p>
                    <p className="font-mono text-slate-900 dark:text-white">{product.hsn_code || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">GST %</p>
                    <p className="text-slate-900 dark:text-white">{product.gst_percentage}%</p>
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Purchase Price</p>
                    <p className="text-slate-900 dark:text-white font-mono">₹{product.purchase_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Selling Price</p>
                    <p className="text-slate-900 dark:text-white font-mono">₹{product.selling_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">MRP</p>
                    <p className="text-slate-900 dark:text-white font-mono">₹{product.mrp.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Margin</p>
                    <p className="text-slate-900 dark:text-white font-mono">
                      {product.selling_price > 0
                        ? (((product.selling_price - product.purchase_price) / product.selling_price) * 100).toFixed(1)
                        : '0'}
                      %
                    </p>
                  </div>
                </div>
              </section>

              {/* Inventory */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Inventory</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Available Stock</p>
                    <p className="text-slate-900 dark:text-white font-mono text-lg">{product.available_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Minimum Stock</p>
                    <p className="text-slate-900 dark:text-white font-mono">{product.minimum_stock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Reorder Level</p>
                    <p className="text-slate-900 dark:text-white font-mono">{product.reorder_level}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Maximum Stock</p>
                    <p className="text-slate-900 dark:text-white font-mono">{product.maximum_stock || '—'}</p>
                  </div>
                </div>
              </section>

              {/* Storage Location */}
              {(product.storage_location || product.rack_number || product.shelf_number || product.bin_number) && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Storage Location</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {product.storage_location && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Warehouse</p>
                        <p className="text-slate-900 dark:text-white">{product.storage_location}</p>
                      </div>
                    )}
                    {product.rack_number && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Rack</p>
                        <p className="text-slate-900 dark:text-white">{product.rack_number}</p>
                      </div>
                    )}
                    {product.shelf_number && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Shelf</p>
                        <p className="text-slate-900 dark:text-white">{product.shelf_number}</p>
                      </div>
                    )}
                    {product.bin_number && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Bin</p>
                        <p className="text-slate-900 dark:text-white">{product.bin_number}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Tracking Flags */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Tracking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Batch Tracking</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.batch_tracking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.batch_tracking ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expiry Tracking</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.expiry_tracking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.expiry_tracking ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prescription Required</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.is_prescription ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.is_prescription ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </section>

              {product.description && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{product.description}</p>
                </section>
              )}
            </>
          )}

          {!loading && !error && !product && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No product data available</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {product && !loading && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 flex gap-2">
            <button
              onClick={() => {
                onEdit(product.uuid)
                onClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit size={16} /> Edit
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
