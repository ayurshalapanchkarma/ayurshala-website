'use client';

import { useState } from 'react';
import { Search, Download } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: 'BILL' | 'PAYMENT' | 'RETURN' | 'REFUND' | 'CREDIT' | 'DEBIT';
  description: string;
  amount: number;
  balance: number;
}

interface PatientLedger {
  patientId: string;
  patientName: string;
  phone: string;
  email: string;
  transactions: Transaction[];
  openingBalance: number;
  currentBalance: number;
  totalCharges: number;
  totalPayments: number;
  totalRefunds: number;
  lastTransaction: string;
}

export default function PharmacyPatientLedger() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientLedger | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const searchPatients = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/patients/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const { data } = await res.json();
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = async (patient: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/patients/${patient.id}?type=history`);
      if (res.ok) {
        const { data } = await res.json();
        setSelectedPatient(data);
        setSearchQuery(patient.name);
        setSearchResults([]);
      }
    } catch (error) {
      showToast('error', 'Failed to load patient ledger');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = selectedPatient?.transactions.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    const tDate = new Date(t.date);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return tDate >= from && tDate <= to;
  }) || [];

  const exportLedger = () => {
    if (!selectedPatient) return;

    const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('en-IN'),
      t.type,
      t.description,
      t.amount.toFixed(2),
      t.balance.toFixed(2)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${selectedPatient.patientName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('success', 'Ledger exported');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Patient Ledger</h1>

        {!selectedPatient ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Search Patient</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchPatients(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg mt-4 max-h-64 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => selectPatient(patient)}
                    className="p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{patient.phone || patient.email}</div>
                  </div>
                ))}
              </div>
            )}

            {loading && <div className="text-center mt-8 text-gray-500">Loading...</div>}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPatient.patientName}</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedPatient.phone} | {selectedPatient.email}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
                >
                  Change Patient
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Opening Balance</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedPatient.openingBalance.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Total Charges</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedPatient.totalCharges.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Total Payments</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedPatient.totalPayments.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                  <div className="text-xs text-red-600 dark:text-red-400 font-semibold">Total Refunds</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedPatient.totalRefunds.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Current Balance</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedPatient.currentBalance.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="ALL">All Types</option>
                    <option value="BILL">Bills</option>
                    <option value="PAYMENT">Payments</option>
                    <option value="RETURN">Returns</option>
                    <option value="REFUND">Refunds</option>
                    <option value="CREDIT">Credits</option>
                    <option value="DEBIT">Debits</option>
                  </select>
                </div>

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
                    onClick={exportLedger}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {new Date(txn.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              txn.type === 'BILL' ? 'bg-blue-100 text-blue-800' :
                              txn.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                              txn.type === 'RETURN' ? 'bg-orange-100 text-orange-800' :
                              txn.type === 'REFUND' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{txn.description}</td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                            ₹{txn.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                            ₹{txn.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
