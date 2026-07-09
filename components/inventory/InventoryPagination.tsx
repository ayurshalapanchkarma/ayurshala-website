import { ChevronLeft, ChevronRight } from 'lucide-react'

interface InventoryPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function InventoryPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: InventoryPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const isPrevDisabled = currentPage === 1
  const isNextDisabled = currentPage === totalPages

  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {startItem}–{endItem} of {totalItems}
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={isPrevDisabled}
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg transition-colors
            ${
              isPrevDisabled
                ? 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 opacity-50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Page Indicator */}
        <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg transition-colors
            ${
              isNextDisabled
                ? 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 opacity-50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600'
            }
          `}
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
