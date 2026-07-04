'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VisitData {
  uuid: string;
  visit_number: string;
  visit_date: string;
  visit_status: string;
  patient_name: string;
  phone: string;
  doctor_name: string;
  checked_in_at: string;
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    pulse_rate?: number;
    temperature_c?: number;
    respiratory_rate?: number;
    spo2?: number;
    height_cm?: number;
    weight_kg?: number;
    bmi?: number;
  };
}

interface TimelineEvent {
  uuid: string;
  event_type: string;
  title: string;
  description?: string;
  actor?: { name: string };
  metadata: Record<string, any>;
  created_at: string;
}

export default function VisitDetailsPage({ params }: { params: { visitId: string } }) {
  const { visitId } = params;

  const [visit, setVisit] = useState<VisitData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load visit and timeline
  useEffect(() => {
    const loadData = async () => {
      try {
        const [visitRes, timelineRes] = await Promise.all([
          fetch(`/api/emr/visits/${visitId}`),
          fetch(`/api/emr/visits/${visitId}/timeline`)
        ]);

        if (!visitRes.ok || !timelineRes.ok) throw new Error('Failed to load data');

        const { data: visitData } = await visitRes.json();
        const { data: timelineData } = await timelineRes.json();

        setVisit(visitData);
        setTimeline(timelineData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load visit details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [visitId]);

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/emr/visits/${visitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_status: newStatus,
          updated_by: 'current-user-id' // TODO: Get from auth
        })
      });

      if (!res.ok) throw new Error('Failed to update status');

      const { data } = await res.json();
      setVisit(data);

      // Refresh timeline
      const timelineRes = await fetch(`/api/emr/visits/${visitId}/timeline`);
      const { data: timelineData } = await timelineRes.json();
      setTimeline(timelineData);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading visit...</div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Visit not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/doctor/queue" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Back to Queue
        </Link>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Visit Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visit #{visit.visit_number}</h1>
              <p className="text-gray-600 mt-1">{visit.visit_date}</p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
                visit.visit_status === 'CHECKED_IN' ? 'bg-yellow-100 text-yellow-800' :
                visit.visit_status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-800' :
                visit.visit_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {visit.visit_status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Patient</p>
              <p className="text-lg font-semibold text-gray-900">{visit.patient_name}</p>
              <p className="text-gray-600">{visit.phone}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Doctor</p>
              <p className="text-lg font-semibold text-gray-900">{visit.doctor_name}</p>
            </div>
          </div>

          {/* Status Transitions */}
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {['IN_CONSULTATION', 'PRESCRIPTION_READY', 'THERAPY_ASSIGNED', 'COMPLETED'].map(
                status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updatingStatus || visit.visit_status === status}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                )
              )}
              {visit.visit_status !== 'CANCELLED' && (
                <button
                  onClick={() => updateStatus('CANCELLED')}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                >
                  Cancel Visit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Vitals Section */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vitals</h2>

              {visit.vitals && Object.values(visit.vitals).some(v => v !== null && v !== undefined) ? (
                <div className="grid grid-cols-3 gap-4">
                  {visit.vitals.systolic_bp && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600">BP (Systolic)</p>
                      <p className="text-2xl font-bold text-blue-600">{visit.vitals.systolic_bp}</p>
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>
                  )}
                  {visit.vitals.diastolic_bp && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600">BP (Diastolic)</p>
                      <p className="text-2xl font-bold text-blue-600">{visit.vitals.diastolic_bp}</p>
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>
                  )}
                  {visit.vitals.pulse_rate && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-gray-600">Pulse</p>
                      <p className="text-2xl font-bold text-red-600">{visit.vitals.pulse_rate}</p>
                      <p className="text-xs text-gray-500">bpm</p>
                    </div>
                  )}
                  {visit.vitals.temperature_c && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600">Temperature</p>
                      <p className="text-2xl font-bold text-orange-600">{visit.vitals.temperature_c}</p>
                      <p className="text-xs text-gray-500">°C</p>
                    </div>
                  )}
                  {visit.vitals.respiratory_rate && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600">Resp. Rate</p>
                      <p className="text-2xl font-bold text-green-600">{visit.vitals.respiratory_rate}</p>
                      <p className="text-xs text-gray-500">breaths/min</p>
                    </div>
                  )}
                  {visit.vitals.spo2 && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600">SpO₂</p>
                      <p className="text-2xl font-bold text-purple-600">{visit.vitals.spo2}</p>
                      <p className="text-xs text-gray-500">%</p>
                    </div>
                  )}
                  {visit.vitals.bmi && (
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-xs text-gray-600">BMI</p>
                      <p className="text-2xl font-bold text-indigo-600">{visit.vitals.bmi}</p>
                      <p className="text-xs text-gray-500">kg/m²</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No vitals recorded yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link
                href={`/doctor/visit/${visitId}/assessment`}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center transition"
              >
                Ayurvedic Assessment
              </Link>
              <Link
                href={`/doctor/visit/${visitId}/prescription`}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-center transition"
              >
                Create Prescription
              </Link>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-gray-600 text-sm">No events yet</p>
              ) : (
                timeline.map((event, idx) => (
                  <div key={event.uuid} className="relative pl-4">
                    {idx < timeline.length - 1 && (
                      <div className="absolute left-0 top-6 w-0.5 h-12 bg-gray-300"></div>
                    )}
                    <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-blue-600"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
