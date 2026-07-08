'use client'

import { AlertTriangle, Loader } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  isLoading: boolean
  productName: string
  onConfirm: () => void
  onCancel: () => void
  error?: string | null
}

export default function DeleteConfirmationDialog({
  isOpen,
  isLoading,
  productName,
  onConfirm,
  onCancel,
  error,
}: DeleteConfirmationDialogProps) {
  console.log(`[DeleteConfirmationDialog] Rendering with isOpen=${isOpen}`)
  if (!isOpen) {
    console.log(`[DeleteConfirmationDialog] Dialog not open, returning null`)
    return null
  }

  console.log(`[DeleteConfirmationDialog] Showing dialog for product: ${productName}`)
  
  // Render directly to ensure visibility
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100]"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full">
        {/* Icon & Header */}
        <div className="p-6 text-center border-b border-gray-200 dark:border-slate-700">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Product?</h3>
        </div>

        {/* Message */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">You are about to delete:</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-1">{productName}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This product will be marked as inactive. You can restore it later from the product list.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">Cannot delete this product:</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !!error}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size={16} className="animate-spin" />}
            Delete
          </button>
        </div>
        </div>
      </div>
    </>
  )
}
