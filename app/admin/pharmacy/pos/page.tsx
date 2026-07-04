'use client';

import { useState, useRef } from 'react';
import { Search, Trash2, Save, X, Check } from 'lucide-react';

interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  batchNumber: string;
  totalPrice: number;
}

interface Bill {
  patientId: string | null;
  patientName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMode: string;
  discountType: 'NONE' | 'PERCENTAGE' | 'FLAT';
  discountValue: number;
}

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'CHEQUE', 'CREDIT'];

export default function PharmacyPOS() {
  const [bill, setBill] = useState<Bill>({
    patientId: null,
    patientName: 'Walk-in Customer',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentMode: 'CASH',
    discountType: 'NONE',
    discountValue: 0
  });

  const [medicineSearch, setMedicineSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const searchMedicines = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/medicines/search?q=${encodeURIComponent(query)}`);
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

  const addItem = (medicine: any) => {
    const existingItem = bill.items.find(i => i.productId === medicine.id);
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      bill.items.push({
        productId: medicine.id,
        productName: medicine.name,
        quantity: 1,
        unitPrice: medicine.selling_price || 0,
        batchNumber: medicine.batch_number || '',
        totalPrice: medicine.selling_price || 0
      });
    }
    calculateTotals();
    setMedicineSearch('');
    setSearchResults([]);
    showToast('success', `${medicine.name} added`);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    bill.items[index].quantity = quantity;
    bill.items[index].totalPrice = quantity * bill.items[index].unitPrice;
    calculateTotals();
  };

  const removeItem = (index: number) => {
    bill.items.splice(index, 1);
    calculateTotals();
  };

  const calculateTotals = () => {
    const subtotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.05;
    let total = subtotal + tax;

    if (bill.discountType === 'PERCENTAGE') {
      total = total - (total * bill.discountValue) / 100;
    } else if (bill.discountType === 'FLAT') {
      total = total - bill.discountValue;
    }

    setBill(prev => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.max(0, Math.round(total * 100) / 100)
    }));
  };

  const completeSale = async () => {
    if (bill.items.length === 0) {
      showToast('error', 'Add items to bill');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pharmacy/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: bill.patientId,
          items: bill.items,
          discount_type: bill.discountType,
          discount_value: bill.discountValue,
          payment_mode: bill.paymentMode
        })
      });

      if (res.ok) {
        const { data } = await res.json();
        showToast('success', 'Sale completed');
        setBill({
          patientId: null,
          patientName: 'Walk-in Customer',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          paymentMode: 'CASH',
          discountType: 'NONE',
          discountValue: 0
        });
        setShowPaymentModal(false);
      }
    } catch (error) {
      showToast('error', 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Pharmacy POS</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medicine Search */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Medicines</h2>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value);
                    searchMedicines(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto mb-4">
                  {searchResults.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => addItem(medicine)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{medicine.name}</div>
                        <div className="text-xs text-gray-500">Batch: {medicine.batch_number}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">₹{medicine.selling_price?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bill Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bill Items</h2>

              {bill.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No items added</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bill.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                        <div className="text-xs text-gray-500">Batch: {item.batchNumber}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"
                        />
                        <div className="text-right min-w-24">
                          <div className="text-sm text-gray-600">₹{item.unitPrice.toFixed(2)}</div>
                          <div className="font-semibold text-gray-900 dark:text-white">₹{item.totalPrice.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Bill Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-semibold">₹{bill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax (5%):</span>
                <span className="font-semibold">₹{bill.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-3 border-t">
                <span>Total:</span>
                <span>₹{bill.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
              <select
                value={bill.paymentMode}
                onChange={(e) => setBill({ ...bill, paymentMode: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {PAYMENT_MODES.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={bill.items.length === 0 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                <Check className="w-4 h-4 inline mr-2" />
                Complete Sale
              </button>
              <button
                onClick={() => {
                  setBill({
                    patientId: null,
                    patientName: 'Walk-in Customer',
                    items: [],
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    paymentMode: 'CASH',
                    discountType: 'NONE',
                    discountValue: 0
                  });
                }}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <X className="w-4 h-4 inline mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Payment</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{bill.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                <span className="font-medium">{bill.paymentMode}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={completeSale}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
