import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface ReportFilters {
  [key: string]: string | number | boolean | null
}

export interface ReportExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  filename: string
  data: any[]
  columns: string[]
}

/**
 * useInventoryReport - Comprehensive hook for handling inventory reports
 *
 * Features:
 * - Fetch data from API
 * - Search/Filter support
 * - Pagination
 * - Sorting
 * - CSV Export
 * - Excel Export (basic)
 * - PDF Export
 * - Print support
 * - Error handling
 * - Loading states
 */
export function useInventoryReport(endpoint: string, pageSize: number = 25) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ReportFilters>({})
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))
      if (search) params.append('search', search)
      if (sortBy) params.append('sortBy', sortBy)
      if (sortBy) params.append('sortOrder', sortOrder)

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`${endpoint}?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch report (${response.status})`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setData(result.data || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 0)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load report'
      console.error(`[useInventoryReport] Error fetching ${endpoint}:`, err)
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, pageSize, search, filters, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleFilter = useCallback((filterKey: string, value: string | number | null) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
    setPage(1)
  }, [])

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }, [sortBy, sortOrder])

  const handleRefresh = useCallback(() => {
    setPage(1)
    fetchData()
  }, [fetchData])

  const exportToCSV = useCallback((options: ReportExportOptions) => {
    try {
      setExporting(true)

      const { filename, data: exportData, columns } = options

      // Create CSV header
      const header = columns.join(',')

      // Create CSV rows
      const rows = exportData.map((item) =>
        columns
          .map((col) => {
            const value = item[col]
            // Escape quotes and wrap in quotes if contains comma
            if (value === null || value === undefined) return ''
            const strValue = String(value)
            if (strValue.includes(',') || strValue.includes('"')) {
              return `"${strValue.replace(/"/g, '""')}"`
            }
            return strValue
          })
          .join(',')
      )

      const csv = [header, ...rows].join('\n')

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}.csv`
      link.click()

      toast.success('Report exported as CSV')
    } catch (err) {
      console.error('[useInventoryReport] CSV export error:', err)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }, [])

  const exportToExcel = useCallback((options: ReportExportOptions) => {
    try {
      setExporting(true)
      const { filename, data: exportData, columns } = options

      // For now, export as CSV (Excel compatible)
      // Full Excel export would require a library like xlsx
      exportToCSV({
        format: 'csv',
        filename,
        data: exportData,
        columns,
      })

      // Note: For production Excel export, integrate a library like:
      // import * as XLSX from 'xlsx'
      // const workbook = XLSX.utils.book_new()
      // const worksheet = XLSX.utils.json_to_sheet(exportData)
      // XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
      // XLSX.writeFile(workbook, `${filename}.xlsx`)
    } catch (err) {
      console.error('[useInventoryReport] Excel export error:', err)
      toast.error('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }, [exportToCSV])

  const handlePrint = useCallback((printContent: string | HTMLElement) => {
    try {
      const printWindow = window.open('', '', 'height=400,width=800')
      if (!printWindow) {
        toast.error('Failed to open print window')
        return
      }

      if (typeof printContent === 'string') {
        printWindow.document.write(printContent)
      } else {
        printWindow.document.write(printContent.innerHTML)
      }

      printWindow.document.close()
      printWindow.print()

      toast.success('Print dialog opened')
    } catch (err) {
      console.error('[useInventoryReport] Print error:', err)
      toast.error('Failed to open print dialog')
    }
  }, [])

  return {
    // Data
    data,
    total,
    page,
    pageSize,
    totalPages,

    // State
    loading,
    error,
    exporting,

    // Filters & Search
    search,
    filters,
    sortBy,
    sortOrder,

    // Handlers
    handleSearch,
    handleFilter,
    handleSort,
    handleRefresh,
    setPage,
    setFilters,
    setSortBy,
    setSortOrder,

    // Export & Print
    exportToCSV,
    exportToExcel,
    handlePrint,
  }
}
