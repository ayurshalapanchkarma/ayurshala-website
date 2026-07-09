'use client'

import { AlertTriangle, Loader } from 'lucide-react'
import { useEffect } from 'react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  isLoading?: boolean
  title?: string
  itemName?: string
  message?: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
  error?: string | null
  disableConfirm?: boolean
}

/**
 * DeleteConfirmationDialog - Reusable confirmation modal for all delete actions
 * 
 * Replaces window.confirm() browser dialog with a custom glassmorphic modal.
 * 
 * Features:
 * - Glasmorphic design matching Inventory UI
 * - Support for custom messages
 * - Loading state while API executes
 * - Error display
 * - Keyboard support (ESC to close)
 * - Click outside to close
 * - Works in light & dark modes
 * 
 * Usage:
 *   const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null)
 *   
 *   <DeleteConfirmationDialog
 *     isOpen={!!deleteConfirm}
 *     itemName={deleteConfirm?.name}
 *     message="Are you sure you want to delete this item? This action cannot be undone."
 *     onConfirm={async () => {
 *       await deleteApi(deleteConfirm.id)
 *       setDeleteConfirm(null)
 *       toast.success('Deleted')
 *     }}
 *     onCancel={() => setDeleteConfirm(null)}
 *   />
 */
export default function DeleteConfirmationDialog({
  isOpen,
  isLoading = false,
  title = 'Delete Item?',
  itemName,
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  onConfirm,
  onCancel,
  error = null,
  disableConfirm = false,
}: DeleteConfirmationDialogProps) {
  
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] transition-opacity"
        onClick={() => !isLoading && onCancel()}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 text-center border-b border-gray-200 dark:border-slate-700">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {itemName && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Item:</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words">
                  {itemName}
                </p>
              </div>
            )}

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {message}
              </p>
            </div>

            {error && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
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
              disabled={isLoading || disableConfirm || !!error}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isLoading && <Loader size={16} className="animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
