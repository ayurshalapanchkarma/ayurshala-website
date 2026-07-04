'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Visit {
  uuid: string;
  visit_number: string;
  patient?: { name: string };
}

interface TreatmentPlan {
  id: string;
  visit_uuid: string;
  treatment_plan_status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  panchakarma_type: string;
  total_sessions: number;
  session_duration_minutes: number;
  frequency: string;
  start_date?: string;
  end_date?: string;
  treatment_objectives?: string;
  special_precautions?: string;
}

interface TherapySession {
  id: string;
  visit_uuid: string;
  treatment_plan_uuid: string;
  therapy_session_status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  session_number: number;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes?: number;
  therapist_name?: string;
  oils_medicines_used?: string;
  patient_response?: string;
  observations?: string;
}

export default function PanchakarmaPage() {
  const params = useParams();
  const visitId = params.visitId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [therapySessions, setTherapySessions] = useState<TherapySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [planForm, setPlanForm] = useState({
    panchakarma_type: '',
    total_sessions: 7,
    session_duration_minutes: 45,
    frequency: 'Daily',
    start_date: '',
    end_date: '',
    treatment_objectives: '',
    special_precautions: '',
  });

  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    scheduled_date: '',
    scheduled_time: '',
    therapist_name: '',
    oils_medicines_used: '',
    quantity: '',
    temperature: '',
    patient_response: '',
    observations: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const visitRes = await fetch(`/api/emr/visits/${visitId}`);
        if (!visitRes.ok) throw new Error('Failed to load visit');
        const visitData = await visitRes.json();
        setVisit(visitData.data);

        const planRes = await fetch(`/api/emr/visits/${visitId}/treatment-plan`);
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.data) {
            setTreatmentPlan(planData.data);
            setPlanForm({
              panchakarma_type: planData.data.panchakarma_type || '',
              total_sessions: planData.data.total_sessions || 7,
              session_duration_minutes: planData.data.session_duration_minutes || 45,
              frequency: planData.data.frequency || 'Daily',
              start_date: planData.data.start_date || '',
              end_date: planData.data.end_date || '',
              treatment_objectives: planData.data.treatment_objectives || '',
              special_precautions: planData.data.special_precautions || '',
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [visitId]);

  const saveTreatmentPlan = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const method = treatmentPlan ? 'PUT' : 'POST';
      const res = await fetch(`/api/emr/visits/${visitId}/treatment-plan`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          treatment_plan_status: 'DRAFT',
        }),
      });

      if (!res.ok) throw new Error('Failed to save treatment plan');

      const data = await res.json();
      setTreatmentPlan(data.data);
      setShowPlanForm(false);
      setSuccess('Treatment plan saved');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const activateTreatmentPlan = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/api/emr/visits/${visitId}/treatment-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          treatment_plan_status: 'ACTIVE',
        }),
      });

      if (!res.ok) throw new Error('Failed to activate');

      const data = await res.json();
      setTreatmentPlan(data.data);
      setSuccess('Treatment plan activated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate');
    } finally {
      setSaving(false);
    }
  };

  const saveTherapySession = async () => {
    try {
      setSaving(true);
      setError('');

      if (!treatmentPlan) throw new Error('Create treatment plan first');

      const res = await fetch(`/api/emr/visits/${visitId}/therapy-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sessionForm,
          treatment_plan_uuid: treatmentPlan.id,
          therapy_session_status: 'SCHEDULED',
        }),
      });

      if (!res.ok) throw new Error('Failed to save session');

      const data = await res.json();
      setTherapySessions([...therapySessions, data.data]);
      setSessionForm({
        session_number: sessionForm.session_number + 1,
        scheduled_date: '',
        scheduled_time: '',
        therapist_name: '',
        oils_medicines_used: '',
        quantity: '',
        temperature: '',
        patient_response: '',
        observations: '',
      });
      setShowSessionForm(false);
      setSuccess('Therapy session saved');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600">Visit not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/doctor/visit/${visitId}`} className="text-blue-600 hover:underline text-sm">
            ← Back to Visit
          </Link>
          <h1 className="text-3xl font-bold mt-2">Panchakarma Management</h1>
          <div className="text-slate-600 mt-1">
            <p className="font-semibold">{visit.visit_number}</p>
            <p className="text-sm">{visit.patient?.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-6">
          {/* Treatment Plan Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Treatment Plan</h2>

            {!treatmentPlan ? (
              <div>
                {!showPlanForm && (
                  <button
                    onClick={() => setShowPlanForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Create Treatment Plan
                  </button>
                )}

                {showPlanForm && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Panchakarma Type *
                      </label>
                      <input
                        type="text"
                        value={planForm.panchakarma_type}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, panchakarma_type: e.target.value })
                        }
                        placeholder="e.g., Vasti, Nasya, Basti, Shirovasti"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Total Sessions
                        </label>
                        <input
                          type="number"
                          value={planForm.total_sessions}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, total_sessions: parseInt(e.target.value) })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Duration (mins)
                        </label>
                        <input
                          type="number"
                          value={planForm.session_duration_minutes}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              session_duration_minutes: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={planForm.frequency}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, frequency: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      >
                        <option>Daily</option>
                        <option>Alternate days</option>
                        <option>Twice daily</option>
                        <option>Thrice daily</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={planForm.start_date}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, start_date: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={planForm.end_date}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, end_date: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Treatment Objectives
                      </label>
                      <textarea
                        value={planForm.treatment_objectives}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, treatment_objectives: e.target.value })
                        }
                        rows={2}
                        placeholder="Goals for this treatment plan"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Special Precautions
                      </label>
                      <textarea
                        value={planForm.special_precautions}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, special_precautions: e.target.value })
                        }
                        rows={2}
                        placeholder="Any contraindications or precautions"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={saveTreatmentPlan}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setShowPlanForm(false)}
                        className="flex-1 px-4 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="space-y-2 mb-4">
                  <p>
                    <strong>Type:</strong> {treatmentPlan.panchakarma_type}
                  </p>
                  <p>
                    <strong>Sessions:</strong> {treatmentPlan.total_sessions} x{' '}
                    {treatmentPlan.session_duration_minutes} mins
                  </p>
                  <p>
                    <strong>Frequency:</strong> {treatmentPlan.frequency}
                  </p>
                  {treatmentPlan.start_date && (
                    <p>
                      <strong>Duration:</strong> {treatmentPlan.start_date}
                      {treatmentPlan.end_date && ` to ${treatmentPlan.end_date}`}
                    </p>
                  )}
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      treatmentPlan.treatment_plan_status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : treatmentPlan.treatment_plan_status === 'DRAFT'
                        ? 'bg-blue-100 text-blue-800'
                        : treatmentPlan.treatment_plan_status === 'COMPLETED'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {treatmentPlan.treatment_plan_status}
                    </span>
                  </p>
                </div>

                {treatmentPlan.treatment_plan_status === 'DRAFT' && (
                  <button
                    onClick={activateTreatmentPlan}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {saving ? 'Activating...' : 'Activate Plan'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Therapy Sessions Section */}
          {treatmentPlan && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Therapy Sessions</h2>

              <div className="mb-4">
                <button
                  onClick={() => setShowSessionForm(!showSessionForm)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  {showSessionForm ? 'Cancel' : 'Schedule Session'}
                </button>
              </div>

              {showSessionForm && (
                <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Session #
                      </label>
                      <input
                        type="number"
                        value={sessionForm.session_number}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, session_number: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Scheduled Date
                      </label>
                      <input
                        type="date"
                        value={sessionForm.scheduled_date}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, scheduled_date: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Therapist Name
                    </label>
                    <input
                      type="text"
                      value={sessionForm.therapist_name}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, therapist_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Oils/Medicines Used
                    </label>
                    <input
                      type="text"
                      value={sessionForm.oils_medicines_used}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, oils_medicines_used: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="text"
                        value={sessionForm.quantity}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, quantity: e.target.value })
                        }
                        placeholder="e.g., 500ml"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Temperature
                      </label>
                      <input
                        type="text"
                        value={sessionForm.temperature}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, temperature: e.target.value })
                        }
                        placeholder="e.g., 37°C"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <button
                    onClick={saveTherapySession}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save Session'}
                  </button>
                </div>
              )}

              {therapySessions.length > 0 ? (
                <div className="space-y-2">
                  {therapySessions.map((session) => (
                    <div key={session.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Session {session.session_number}</p>
                          <p className="text-sm text-slate-600">{session.scheduled_date}</p>
                          {session.therapist_name && (
                            <p className="text-sm text-slate-600">Therapist: {session.therapist_name}</p>
                          )}
                          {session.oils_medicines_used && (
                            <p className="text-sm text-slate-600">
                              Oils: {session.oils_medicines_used}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            session.therapy_session_status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : session.therapy_session_status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {session.therapy_session_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">No sessions scheduled yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
