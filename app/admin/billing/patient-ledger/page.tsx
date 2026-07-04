'use client';

import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';

export default function BillingPatientLedger() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const searchPatients = async (query: string) => {
    if (!query) {
      setPatients([]);
      return;
    }

    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const { data } = await res.json();
        setPatients(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setPatients([]);
    setLoading(true);

    try {
      const res = await fetch(`/api/billing/patients/${patient.id}/ledger?type=ledger`);
      if (res.ok) {
        const { data } = await res.json();
        setLedger(data || []);
      }

      const balRes = await fetch(`/api/billing/patients/${patient.id}/ledger?type=balance`);
      if (balRes.ok) {
        const { data } = await balRes.json();
        setBalance(data?.balance || 0);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLedger = ledger.filter(entry =>
    filterType === 'ALL' || entry.type === filterType
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Patient Ledger</h1>

        {!selectedPatient ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Search Patient</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or patient ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchPatients(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            {patients.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg mt-4 max-h-64 overflow-y-auto">
                {patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{p.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPatient.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedPatient.phone} | {selectedPatient.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                >
                  Change Patient
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Current Balance</div>
                  <div className={`text-2xl font-bold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    ₹{Math.abs(balance).toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {balance > 0 ? 'Outstanding' : 'Advance'}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="ALL">All Transactions</option>
                <option value="CHARGE">Charges</option>
                <option value="PAYMENT">Payments</option>
                <option value="REFUND">Refunds</option>
                <option value="CREDIT">Credits</option>
              </select>
            </div>

            {/* Ledger */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Reference</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No transactions
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {new Date(entry.date || entry.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {entry.type || 'TRANSACTION'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {entry.reference_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                            ₹{(entry.amount || entry.debit_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                            ₹{(entry.balance_after || 0).toFixed(2)}
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
