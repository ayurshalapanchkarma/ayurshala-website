'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface InvoiceItem {
  id: string;
  type: 'CONSULTATION' | 'PROCEDURE' | 'MEDICINE' | 'CONSUMABLE' | 'TREATMENT' | 'ROOM' | 'PACKAGE' | 'LAB' | 'MISC';
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  totalPrice: number;
}

interface Invoice {
  patientId: string | null;
  patientName: string;
  doctorId: string | null;
  departmentId: string | null;
  appointmentId: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountType: 'NONE' | 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  notes: string;
}

const ITEM_TYPES = ['CONSULTATION', 'PROCEDURE', 'MEDICINE', 'CONSUMABLE', 'TREATMENT', 'ROOM', 'PACKAGE', 'LAB', 'MISC'];

export default function BillingCreateInvoice() {
  const [invoice, setInvoice] = useState<Invoice>({
    patientId: null,
    patientName: '',
    doctorId: null,
    departmentId: null,
    appointmentId: null,
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    discountType: 'NONE',
    discountValue: 0,
    notes: ''
  });

  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    type: 'CONSULTATION',
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxPercent: 5
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const { data } = await res.json();
        setDoctors(data || []);
      }
    } catch (error) {
      console.error('Load doctors error:', error);
    }
  };

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

  const selectPatient = (patient: any) => {
    setInvoice({ ...invoice, patientId: patient.id, patientName: patient.name });
    setPatients([]);
    setSearchQuery('');
    setShowPatientSearch(false);
  };

  const addItem = () => {
    if (!newItem.description || !newItem.unitPrice) {
      showToast('error', 'Fill all item fields');
      return;
    }

    const totalPrice = (newItem.quantity || 0) * (newItem.unitPrice || 0);
    const tax = (totalPrice * (newItem.taxPercent || 0)) / 100;

    invoice.items.push({
      id: Date.now().toString(),
      type: (newItem.type as any) || 'MISC',
      description: newItem.description || '',
      quantity: newItem.quantity || 1,
      unitPrice: newItem.unitPrice || 0,
      taxPercent: newItem.taxPercent || 0,
      totalPrice: totalPrice + tax
    });

    calculateTotals();
    setNewItem({ type: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0, taxPercent: 5 });
    setShowItemModal(false);
  };

  const removeItem = (index: number) => {
    invoice.items.splice(index, 1);
    calculateTotals();
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    invoice.items.forEach(item => {
      const lineAmount = item.quantity * item.unitPrice;
      const lineTax = (lineAmount * item.taxPercent) / 100;
      subtotal += lineAmount;
      totalTax += lineTax;
    });

    let total = subtotal + totalTax;

    if (invoice.discountType === 'PERCENTAGE') {
      total = total - (total * invoice.discountValue) / 100;
    } else if (invoice.discountType === 'FLAT') {
      total = total - invoice.discountValue;
    }

    setInvoice(prev => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      total: Math.max(0, Math.round(total * 100) / 100)
    }));
  };

  const saveInvoice = async () => {
    if (!invoice.patientId) {
      showToast('error', 'Select patient');
      return;
    }

    if (invoice.items.length === 0) {
      showToast('error', 'Add items to invoice');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: invoice.patientId,
          doctorId: invoice.doctorId,
          items: invoice.items,
          discountType: invoice.discountType,
          discountAmount: invoice.discountValue,
          notes: invoice.notes
        })
      });

      if (res.ok) {
        showToast('success', 'Invoice created');
        // Reset
        setInvoice({
          patientId: null,
          patientName: '',
          doctorId: null,
          departmentId: null,
          appointmentId: null,
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          discountType: 'NONE',
          discountValue: 0,
          notes: ''
        });
      } else {
        showToast('error', 'Failed to create invoice');
      }
    } catch (error) {
      showToast('error', 'Error creating invoice');
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Create Invoice</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Invoice Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Patient</h2>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patient by name or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchPatients(e.target.value);
                  }}
                  onFocus={() => setShowPatientSearch(true)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />

                {showPatientSearch && patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto z-10">
                    {patients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className="p-3 border-b border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{p.phone || p.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {invoice.patientId && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="font-medium text-green-900 dark:text-green-100">{invoice.patientName}</div>
                  <button
                    onClick={() => setInvoice({ ...invoice, patientId: null, patientName: '' })}
                    className="text-sm text-green-700 dark:text-green-300 hover:underline mt-2"
                  >
                    Change Patient
                  </button>
                </div>
              )}
            </div>

            {/* Doctor Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Doctor</h2>

              <select
                value={invoice.doctorId || ''}
                onChange={(e) => setInvoice({ ...invoice, doctorId: e.target.value || null })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Select doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Invoice Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h2>
                <button
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {invoice.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No items added</div>
              ) : (
                <div className="space-y-3">
                  {invoice.items.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{item.description}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{item.type} - {item.quantity}x ₹{item.unitPrice.toFixed(2)}</div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-semibold text-gray-900 dark:text-white">₹{item.totalPrice.toFixed(2)}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Tax: {item.taxPercent}%</div>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                placeholder="Additional notes for this invoice..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Right: Summary & Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-fit sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="font-semibold">₹{invoice.tax.toFixed(2)}</span>
              </div>

              {invoice.discountType !== 'NONE' && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>Discount ({invoice.discountType}):</span>
                  <span>-₹{invoice.discountValue.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-3 border-t">
                <span>Total:</span>
                <span>₹{invoice.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount</label>
              <select
                value={invoice.discountType}
                onChange={(e) => {
                  setInvoice({ ...invoice, discountType: e.target.value as any, discountValue: 0 });
                  calculateTotals();
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mb-2"
              >
                <option value="NONE">No Discount</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat Amount</option>
              </select>

              {invoice.discountType !== 'NONE' && (
                <input
                  type="number"
                  min="0"
                  value={invoice.discountValue}
                  onChange={(e) => {
                    setInvoice({ ...invoice, discountValue: parseFloat(e.target.value) || 0 });
                    calculateTotals();
                  }}
                  placeholder={invoice.discountType === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹'}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={saveInvoice}
                disabled={loading || !invoice.patientId || invoice.items.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Invoice'}
              </button>
              <button
                onClick={() => {
                  setInvoice({
                    patientId: null,
                    patientName: '',
                    doctorId: null,
                    departmentId: null,
                    appointmentId: null,
                    items: [],
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    discountType: 'NONE',
                    discountValue: 0,
                    notes: ''
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Item</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={newItem.type || 'CONSULTATION'}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  {ITEM_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Item description"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unitPrice || 0}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newItem.taxPercent || 5}
                  onChange={(e) => setNewItem({ ...newItem, taxPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowItemModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
