'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, Eye } from 'lucide-react';

type ReportType = 'daily-sales' | 'medicine-sales' | 'patient-sales' | 'payment' | 'returns' | 'discounts' | 'gst' | 'consumption' | 'profit' | 'inventory-linkage';

interface ReportData {
  [key: string]: any[];
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'daily-sales', label: 'Daily Sales', description: 'Sales by day with payment modes' },
  { value: 'medicine-sales', label: 'Medicine Sales', description: 'Top medicines by revenue' },
  { value: 'patient-sales', label: 'Patient Sales', description: 'Customer spending analysis' },
  { value: 'payment', label: 'Payment Modes', description: 'Collections by payment type' },
  { value: 'returns', label: 'Returns', description: 'Refunds and returns summary' },
  { value: 'discounts', label: 'Discounts', description: 'Discount usage analysis' },
  { value: 'gst', label: 'GST', description: 'Tax collected summary' },
  { value: 'consumption', label: 'Consumption', description: 'Inventory consumption tracking' },
  { value: 'profit', label: 'Profit Analysis', description: 'Profit margin by medicine' },
  { value: 'inventory-linkage', label: 'Inventory Linkage', description: 'Stock vs sales comparison' }
];

export default function PharmacyReports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('daily-sales');
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'export'>('table');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        fromDate,
        toDate
      });

      const res = await fetch(`/api/pharmacy/reports?${params}`);
      if (res.ok) {
        const { data } = await res.json();
        setReportData(data || {});
        showToast('success', 'Report loaded');
      }
    } catch (error) {
      showToast('error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;

    const data = Array.isArray(reportData) ? reportData : Object.values(reportData)[0] || [];
    if (data.length === 0) {
      showToast('error', 'No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h]).join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('success', 'Report exported');
  };

  const exportPDF = () => {
    showToast('success', 'PDF export feature coming soon');
  };

  const printReport = () => {
    if (!reportData) return;

    const data = Array.isArray(reportData) ? reportData : Object.values(reportData)[0] || [];
    if (data.length === 0) {
      showToast('error', 'No data to print');
      return;
    }

    const headers = Object.keys(data[0]);
    const html = `
      <html>
        <head>
          <title>${selectedReport} Report</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedReport}</h1>
            <p>Period: ${fromDate} to ${toDate}</p>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=900');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }

    showToast('success', 'Print dialog opened');
  };

  const reportData_array = Array.isArray(reportData) ? reportData : Object.values(reportData || {})[0] || [];
  const headers = reportData_array.length > 0 ? Object.keys(reportData_array[0]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Pharmacy Reports</h1>

        {/* Report Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.value}
              onClick={() => setSelectedReport(rt.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedReport === rt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{rt.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rt.description}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>

            <div className="flex items-end">
              <div className="w-full flex gap-2">
                <button
                  onClick={exportCSV}
                  disabled={!reportData_array.length}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
                <button
                  onClick={printReport}
                  disabled={!reportData_array.length}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Data */}
        {reportData_array.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {reportData_array.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {headers.map(h => (
                        <td key={h} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {typeof row[h] === 'number' ? row[h].toFixed(2) : row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData_array.length > 100 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
                Showing 100 of {reportData_array.length} rows
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Generate a report to view data</p>
          </div>
        )}
      </div>
    </div>
  );
}
