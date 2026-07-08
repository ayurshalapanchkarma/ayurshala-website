import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface ProductActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
  validationErrors?: Record<string, string>
}

interface UseProductActionsOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useProductActions(options: UseProductActionsOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetProduct = useCallback(
    async (productId: string) => {
      setLoading(true)
      setError(null)

      try {
        console.log(`[useProductActions] Fetching product: ${productId}`)
        const response = await fetch(`/api/inventory/products/${productId}`)

        if (!response.ok) {
          const errorData = await response.json()
          const errorMsg = errorData.error || `Failed to fetch product (${response.status})`
          console.error(`[useProductActions] Error response:`, errorData)
          setError(errorMsg)
          throw new Error(errorMsg)
        }

        const data = await response.json()
        console.log(`[useProductActions] Product fetched successfully:`, data)
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch product'
        console.error(`[useProductActions] Error fetching product:`, err)
        setError(errorMsg)
        if (options.onError) options.onError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  const handleUpdateProduct = useCallback(
    async (productId: string, updates: any) => {
      setLoading(true)
      setError(null)

      try {
        console.log(`[useProductActions] Updating product: ${productId}`, updates)
        const response = await fetch(`/api/inventory/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json()
          const errorMsg = errorData.error || `Failed to update product (${response.status})`
          console.error(`[useProductActions] Update error response:`, errorData)
          setError(errorMsg)
          throw new Error(errorMsg)
        }

        const data = await response.json()
        console.log(`[useProductActions] Product updated successfully:`, data)
        toast.success('Product updated successfully')
        if (options.onSuccess) options.onSuccess()
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update product'
        console.error(`[useProductActions] Error updating product:`, err)
        setError(errorMsg)
        toast.error(errorMsg)
        if (options.onError) options.onError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      setLoading(true)
      setError(null)

      try {
        console.log(`[useProductActions] Deleting product: ${productId}`)
        
        // First, fetch the product to check validations
        const product = await handleGetProduct(productId)
        console.log(`[useProductActions] Product details before delete:`, product)

        // Check validations
        if (product.currentStock && product.currentStock > 0) {
          const errorMsg = `Cannot delete product with current stock (${product.currentStock} units available)`
          console.error(`[useProductActions] Validation failed: ${errorMsg}`)
          setError(errorMsg)
          toast.error(errorMsg)
          throw new Error(errorMsg)
        }

        const response = await fetch(`/api/inventory/products/${productId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json()
          const errorMsg = errorData.error || `Failed to delete product (${response.status})`
          console.error(`[useProductActions] Delete error response:`, errorData)
          setError(errorMsg)
          throw new Error(errorMsg)
        }

        const data = await response.json()
        console.log(`[useProductActions] Product deleted successfully:`, data)
        toast.success('Product marked as inactive')
        if (options.onSuccess) options.onSuccess()
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete product'
        console.error(`[useProductActions] Error deleting product:`, err)
        setError(errorMsg)
        if (!errorMsg.includes('Cannot delete')) {
          toast.error(errorMsg)
        }
        if (options.onError) options.onError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [options, handleGetProduct]
  )

  return {
    loading,
    error,
    handleGetProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    setError,
  }
}
