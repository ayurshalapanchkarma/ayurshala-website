'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ConsultationListItem {
  id: string;
  visit_uuid: string;
  consultation_status: 'DRAFT' | 'FINALIZED';
  chief_complaint?: string;
  soap_complete: boolean;
  updated_at: string;
  visit?: {
    visit_number: string;
    patient_uuid: string;
    visit_status: string;
    patient?: {
      name: string;
      phone: string;
    };
  };
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'FINALIZED'>('ALL');

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Filter by doctor_uuid from auth
      const res = await fetch('/api/emr/consultations');
      if (!res.ok) throw new Error('Failed to load consultations');
      
      const data = await res.json();
      setConsultations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    if (filter === 'ALL') return true;
    return c.consultation_status === filter;
  });

  const stats = {
    total: consultations.length,
    draft: consultations.filter((c) => c.consultation_status === 'DRAFT').length,
    finalized: consultations.filter((c) => c.consultation_status === 'FINALIZED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/doctor/queue" className="text-blue-600 hover:underline text-sm">
            ← Back to Queue
          </Link>
          <h1 className="text-3xl font-bold mt-2">My Consultations</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold">Total Consultations</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold">Draft</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold">Finalized</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.finalized}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-4 flex gap-2">
          {(['ALL', 'DRAFT', 'FINALIZED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center text-slate-600">Loading consultations...</div>
          ) : filteredConsultations.length === 0 ? (
            <div className="p-6 text-center text-slate-600">No consultations found</div>
          ) : (
            <div className="divide-y">
              {filteredConsultations.map((consultation) => (
                <Link
                  key={consultation.id}
                  href={`/doctor/consultation/${consultation.visit_uuid}`}
                  className="p-4 hover:bg-slate-50 transition flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      {consultation.visit?.visit_number}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {consultation.visit?.patient?.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Chief Complaint: {consultation.chief_complaint || '(Not provided)'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Updated: {new Date(consultation.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.consultation_status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {consultation.consultation_status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.soap_complete
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {consultation.soap_complete ? '✅ Complete' : '⏳ Incomplete'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
