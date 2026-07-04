'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';

type ReportType = 'revenue' | 'collections' | 'outstanding' | 'refunds' | 'packages';

const REPORTS = [
  { value: 'revenue' as ReportType, label: 'Revenue Report', description: 'All invoices & collections' },
  { value: 'collections' as ReportType, label: 'Collections', description: 'Payments by mode' },
  { value: 'outstanding' as ReportType, label: 'Outstanding', description: 'Unpaid invoices' },
  { value: 'refunds' as ReportType, label: 'Refunds', description: 'All refunds issued' },
  { value: 'packages' as ReportType, label: 'Packages', description: 'Package utilization' }
];

export default function BillingReports() {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/reports?type=${reportType}&fromDate=${fromDate}&toDate=${toDate}`);
      if (res.ok) {
        const { data } = await res.json();
        setReportData(data || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(row => headers.map(h => row[h]).join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-${toDate}.csv`;
    a.click();
  };

  const printReport = () => {
    if (reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    const html = `
      <html>
        <head>
          <title>${reportType} Report</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${reportType} Report</h1>
          <p>Period: ${fromDate} to ${toDate}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${reportData.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')}
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
  };

  const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Billing Reports</h1>

        {/* Report Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {REPORTS.map(r => (
            <button
              key={r.value}
              onClick={() => setReportType(r.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                reportType === r.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{r.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{r.description}</div>
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
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Generate'}
              </button>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={exportCSV}
                disabled={!reportData.length}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                CSV
              </button>
              <button
                onClick={printReport}
                disabled={!reportData.length}
                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Printer className="w-3 h-3" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Report Data */}
        {reportData.length > 0 ? (
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
                  {reportData.slice(0, 100).map((row, idx) => (
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

            {reportData.length > 100 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
                Showing 100 of {reportData.length} rows
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
