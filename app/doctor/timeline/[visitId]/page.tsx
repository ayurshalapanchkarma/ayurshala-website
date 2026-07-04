'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Visit {
  uuid: string;
  visit_number: string;
  patient?: { name: string };
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
  metadata?: any;
}

interface FollowUp {
  id: string;
  visit_uuid: string;
  follow_up_status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  recommended_date: string;
  follow_up_type: string;
  instructions?: string;
}

export default function ClinicalTimelinePage() {
  const params = useParams();
  const visitId = params.visitId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [followUpForm, setFollowUpForm] = useState({
    recommended_date: '',
    recommended_time: '',
    follow_up_type: 'Post-treatment review',
    instructions: '',
    notes: '',
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

        const timelineRes = await fetch(`/api/emr/visits/${visitId}/timeline`);
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          setTimeline(timelineData.data || []);
        }

        const followUpsRes = await fetch(`/api/emr/visits/${visitId}/follow-ups`);
        if (followUpsRes.ok) {
          const followUpsData = await followUpsRes.json();
          setFollowUps(followUpsData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [visitId]);

  const saveFollowUp = async () => {
    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/emr/visits/${visitId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...followUpForm,
          doctor_uuid: visit?.uuid, // Placeholder - should come from auth context
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule follow-up');

      const data = await res.json();
      setFollowUps([...followUps, data.data]);
      setFollowUpForm({
        recommended_date: '',
        recommended_time: '',
        follow_up_type: 'Post-treatment review',
        instructions: '',
        notes: '',
      });
      setShowFollowUpForm(false);

      // Refresh timeline to show new event
      const timelineRes = await fetch(`/api/emr/visits/${visitId}/timeline`);
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimeline(timelineData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule follow-up');
    } finally {
      setSaving(false);
    }
  };

  const completeFollowUp = async (followUpId: string) => {
    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/emr/visits/${visitId}/follow-ups/${followUpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follow_up_status: 'COMPLETED',
          doctor_uuid: visit?.uuid,
        }),
      });

      if (!res.ok) throw new Error('Failed to complete follow-up');

      const data = await res.json();
      setFollowUps(followUps.map((fu) => (fu.id === followUpId ? data.data : fu)));

      // Refresh timeline
      const timelineRes = await fetch(`/api/emr/visits/${visitId}/timeline`);
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimeline(timelineData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600">Visit not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href={`/doctor/visit/${visitId}`} className="text-blue-600 hover:underline text-sm">
            ← Back to Visit
          </Link>
          <h1 className="text-3xl font-bold mt-2">Clinical Timeline & Follow-ups</h1>
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

        <div className="grid grid-cols-3 gap-6">
          {/* Timeline Column */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Timeline</h2>
              {timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        {idx < timeline.length - 1 && (
                          <div className="w-0.5 h-12 bg-slate-300 my-2"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-slate-800">{event.title}</p>
                        <p className="text-sm text-slate-600">{event.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">No events recorded yet</p>
              )}
            </div>
          </div>

          {/* Follow-ups Column */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Follow-ups</h2>

              <div className="mb-4">
                <button
                  onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                >
                  {showFollowUpForm ? 'Cancel' : 'Schedule'}
                </button>
              </div>

              {showFollowUpForm && (
                <div className="space-y-3 mb-4 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={followUpForm.recommended_date}
                      onChange={(e) =>
                        setFollowUpForm({ ...followUpForm, recommended_date: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={followUpForm.follow_up_type}
                      onChange={(e) =>
                        setFollowUpForm({ ...followUpForm, follow_up_type: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      <option>Post-treatment review</option>
                      <option>Progress assessment</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={followUpForm.instructions}
                      onChange={(e) =>
                        setFollowUpForm({ ...followUpForm, instructions: e.target.value })
                      }
                      rows={2}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="Pre-visit instructions"
                    />
                  </div>
                  <button
                    onClick={saveFollowUp}
                    disabled={saving}
                    className="w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}

              {followUps.length > 0 ? (
                <div className="space-y-2">
                  {followUps.map((fu) => (
                    <div
                      key={fu.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{fu.follow_up_type}</p>
                          <p className="text-xs text-slate-600">{fu.recommended_date}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            fu.follow_up_status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : fu.follow_up_status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {fu.follow_up_status}
                        </span>
                      </div>
                      {fu.follow_up_status === 'SCHEDULED' && (
                        <button
                          onClick={() => completeFollowUp(fu.id)}
                          disabled={saving}
                          className="mt-2 w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs">No follow-ups scheduled</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
