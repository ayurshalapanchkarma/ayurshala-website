'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Clock, Home } from 'lucide-react'

type Refund = {
  id: string
  booking_id: string
  amount: number
  status: string
  reason: string
  created_at: string
  patient?: { full_name: string; patient_id: string }
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')

  useEffect(() => {
    loadRefunds()
  }, [filter])

  async function loadRefunds() {
    setLoading(true)
    const query = supabase.from('refunds').select(`
      *,
      patient:patient_uuid(full_name, patient_id)
    `).order('created_at', { ascending: false })

    if (filter !== 'ALL') {
      query.eq('status', filter)
    }

    const { data, error } = await query
    if (!error) {
      setRefunds(data || [])
    }
    setLoading(false)
  }

  async function updateStatus(refundId: string, newStatus: string) {
    await supabase.from('refunds').update({
      status: newStatus,
      processed_at: newStatus === 'PROCESSED' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', refundId)
    
    loadRefunds()
  }

  const statusIcon = (status: string) => {
    if (status === 'PROCESSED') return <CheckCircle className="w-4 h-4 text-green-600" />
    if (status === 'FAILED') return <XCircle className="w-4 h-4 text-red-600" />
    return <Clock className="w-4 h-4 text-amber-600" />
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none animate-blob1" style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />
      
      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl" style={{ color: '#E8621A' }}>Refund Requests</h1>
          <Link href="/admin" className="btn-glass text-sm py-2 px-4 flex items-center gap-2">
            <Home className="w-4 h-4" /> Admin
          </Link>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['PENDING', 'PROCESSED', 'FAILED', 'ALL'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-sans transition ${
                filter === status
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white/60 text-stone-700 border border-white/80 hover:border-orange-300'
              }`}>
              {status}
            </button>
          ))}
        </div>

        {/* Refunds table */}
        {loading ? (
          <p className="text-center text-stone-400 font-sans">Loading...</p>
        ) : refunds.length === 0 ? (
          <p className="text-center text-stone-400 font-sans">No refunds found</p>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08)' }}>
            <table className="w-full">
              <thead style={{ background: 'rgba(232,98,26,0.08)' }}>
                <tr className="border-b border-white/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund, i) => (
                  <tr key={refund.id} className={`border-b border-white/30 ${i % 2 === 0 ? 'bg-white/20' : 'bg-white/10'} hover:bg-white/30 transition`}>
                    <td className="px-6 py-4 text-sm font-mono font-semibold" style={{ color: '#E8621A' }}>{refund.booking_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-semibold text-stone-900">{refund.patient?.full_name}</p>
                      <p className="text-xs text-stone-500">{refund.patient?.patient_id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-stone-900">₹{refund.amount}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {statusIcon(refund.status)}
                        <span className="capitalize font-semibold text-stone-700">{refund.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {refund.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(refund.id, 'PROCESSED')}
                            className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition">
                            Processed
                          </button>
                          <button
                            onClick={() => updateStatus(refund.id, 'FAILED')}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition">
                            Failed
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
