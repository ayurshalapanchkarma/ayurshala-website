'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface QueueItem {
  visit_id: string;
  visit_number: string;
  patient_name: string;
  patient_id: string;
  phone: string;
  visit_status: string;
  status_label: string;
  waiting_minutes: number;
  token_number: number;
  checked_in_at: string;
}

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch doctor's queue
  const fetchQueue = useCallback(async () => {
    try {
      // TODO: Get doctor UUID from auth context
      const doctorUuid = 'doctor-uuid'; // Placeholder

      const res = await fetch(`/api/emr/visits?queue_type=doctor&doctor_uuid=${doctorUuid}`);
      if (!res.ok) throw new Error('Failed to fetch queue');

      const { data } = await res.json();
      setQueue(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError('Failed to load queue');
    }
  }, []);

  // Load queue on mount
  useEffect(() => {
    setLoading(true);
    fetchQueue().finally(() => setLoading(false));
  }, [fetchQueue]);

  // Auto-refresh queue every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchQueue]);

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'CHECKED_IN': 'bg-yellow-50 border-yellow-200 text-yellow-900',
      'IN_CONSULTATION': 'bg-blue-50 border-blue-200 text-blue-900',
      'PRESCRIPTION_READY': 'bg-green-50 border-green-200 text-green-900',
      'THERAPY_ASSIGNED': 'bg-purple-50 border-purple-200 text-purple-900',
      'COMPLETED': 'bg-gray-50 border-gray-200 text-gray-900'
    };
    return statusColors[status] || 'bg-gray-50 border-gray-200';
  };

  const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
      'CHECKED_IN': 'bg-yellow-100 text-yellow-800',
      'IN_CONSULTATION': 'bg-blue-100 text-blue-800',
      'PRESCRIPTION_READY': 'bg-green-100 text-green-800',
      'THERAPY_ASSIGNED': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Doctor Queue</h1>
            <p className="text-gray-600 mt-1">Today's Patient List</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchQueue}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
            >
              Refresh
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>
            <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Patients</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{queue.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Waiting</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {queue.filter(q => q.visit_status === 'CHECKED_IN').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {queue.filter(q => q.visit_status === 'IN_CONSULTATION').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Ready for Pharmacy</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {queue.filter(q => q.visit_status === 'PRESCRIPTION_READY').length}
            </p>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {queue.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg text-gray-600">No patients in queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Token</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Visit No.</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Waiting</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item, idx) => (
                    <tr
                      key={item.visit_id}
                      className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}
                    >
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {item.token_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                        {item.visit_number}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.patient_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(item.visit_status)}`}>
                          {item.status_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.waiting_minutes} min
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/doctor/visit/${item.visit_id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition inline-block"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
