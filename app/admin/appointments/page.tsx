'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlassBackground from '@/components/GlassBackground'
import { AdminGuard } from '@/components/AdminGuard'
import { useTheme } from 'next-themes'
import { createClient } from '@supabase/supabase-js'
import AppointmentPageHeader from '@/components/AppointmentPageHeader'
import KPISummary from '@/components/KPISummary'
import SmartFilterBar from '@/components/SmartFilterBar'
import TodaysQueue from '@/components/TodaysQueue'
import AppointmentTable from '@/components/AppointmentTable'
import RowDetailsDrawer from '@/components/RowDetailsDrawer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type Booking = {
  id: number
  booking_id: string
  preferred_date: string
  preferred_time: string
  booking_type: string
  status: string
  payment_status: string
  payment_method: string
  refund_status?: string
  refund_amount?: number
  refund_reason?: string
  amount?: number
  amount_paid?: number
  created_at: string
  patient_name: string
  patient_id: string
  patient_phone: string
  patient_email: string
  treatments: string
  rescheduled_at?: string
  doctor_name?: string
  doctor?: string
  notes?: string
}

type Tab = 'today' | 'upcoming' | 'week' | 'completed' | 'cancelled' | 'rescheduled' | 'followups' | 'history'

export default function AdminAppointmentsPage() {
  const [mounted, setMounted] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedTreatment, setSelectedTreatment] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    checkedIn: 0,
    waiting: 0,
    completed: 0,
    cancelled: 0,
    cashPending: 0,
    todayRevenue: 0,
  })
  const [selectedRow, setSelectedRow] = useState<Booking | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const dark = mounted && theme === 'dark'

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [activeTab, searchQuery])

  async function fetchBookings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings?payment=ALL')
      const data = await res.json()
      const allBookings = data.bookings || []
      let filtered = allBookings
      const now = new Date()

      if (activeTab === 'today') {
        filtered = allBookings.filter((b: Booking) => {
          const bDate = new Date(b.preferred_date)
          return bDate.toDateString() === now.toDateString()
        })
      } else if (activeTab === 'completed') {
        filtered = allBookings.filter((b: Booking) => b.status === 'COMPLETED')
      } else if (activeTab === 'cancelled') {
        filtered = allBookings.filter((b: Booking) => b.status === 'CANCELLED')
      }

      if (searchQuery) {
        filtered = filtered.filter(
          (b: Booking) =>
            b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.booking_id.includes(searchQuery)
        )
      }

      const todayBookings = allBookings.filter((b: Booking) => {
        const bDate = new Date(b.preferred_date)
        return bDate.toDateString() === now.toDateString()
      })

      setStats({
        today: todayBookings.length,
        pending: allBookings.filter((b: Booking) => b.status === 'PENDING_CONFIRMATION').length,
        checkedIn: todayBookings.filter((b: Booking) => b.status === 'IN_PROGRESS').length,
        waiting: todayBookings.filter((b: Booking) => b.payment_status === 'PENDING').length,
        completed: todayBookings.filter((b: Booking) => b.status === 'COMPLETED').length,
        cancelled: allBookings.filter((b: Booking) => b.status === 'CANCELLED').length,
        cashPending: allBookings.filter(
          (b: Booking) => b.payment_method === 'CASH_ON_ARRIVAL' && b.payment_status === 'PENDING'
        ).length,
        todayRevenue: 0,
      })

      setBookings(filtered)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
    setLoading(false)
  }

  const getStatusBadge = (booking: Booking) => {
    const { status, rescheduled_at } = booking
    if (status === 'PAYMENT_PENDING') return { label: 'Payment Pending', cls: 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200' }
    if (status === 'PENDING_CONFIRMATION') return { label: 'Pending', cls: 'bg-yellow-100/80 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-200' }
    if (status === 'CONFIRMED' && rescheduled_at) return { label: 'Rescheduled', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
    if (status === 'CONFIRMED') return { label: 'Confirmed', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
    if (status === 'CANCELLED') return { label: 'Cancelled', cls: 'bg-red-100/80 text-red-900 dark:bg-red-950/50 dark:text-red-200' }
    if (status === 'COMPLETED') return { label: 'Completed', cls: 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' }
    if (status === 'IN_PROGRESS') return { label: 'In Progress', cls: 'bg-purple-100/80 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200' }
    return { label: status, cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
  }

  const getPaymentBadge = (booking: Booking) => {
    const { payment_status } = booking
    if (payment_status === 'PAID' || payment_status === 'SUCCESS') return { label: 'Paid', cls: 'bg-green-100/80 text-green-900 dark:bg-green-950/50 dark:text-green-200' }
    if (payment_status === 'PENDING' || payment_status === 'COD_PENDING') return { label: 'Cash Pending', cls: 'bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200' }
    if (payment_status === 'REFUND_PENDING') return { label: 'Refund Pending', cls: 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200' }
    return { label: payment_status || 'Unknown', cls: 'bg-gray-100/80 text-gray-900 dark:bg-gray-950/50 dark:text-gray-200' }
  }

  const getAvailableActions = (booking: Booking) => {
    const { status } = booking
    if (status === 'PENDING_CONFIRMATION') return ['confirm', 'cancel']
    if (status === 'CONFIRMED') return ['cancel']
    if (status === 'CANCELLED' || status === 'COMPLETED' || status === 'NO_SHOW') return []
    if (status === 'IN_PROGRESS') return ['mark_completed', 'mark_no_show']
    return []
  }

  const getDoctorName = (booking: Booking) => {
    if (booking.doctor_name) return booking.doctor_name
    if (booking.doctor) return booking.doctor
    return ''
  }

  const todayAppointments = bookings
    .filter((b) => {
      const bDate = new Date(b.preferred_date)
      const now = new Date()
      return bDate.toDateString() === now.toDateString()
    })
    .slice(0, 5)

  return (
    <AdminGuard>
      <div className={`min-h-screen ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AppointmentPageHeader
            dark={dark}
            currentTime={currentTime}
            onThemeToggle={() => setTheme(dark ? 'light' : 'dark')}
            onLogout={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}
          />

          <KPISummary dark={dark} stats={stats} />

          <SmartFilterBar
            dark={dark}
            activeTab={activeTab}
            searchQuery={searchQuery}
            selectedDoctor={selectedDoctor}
            selectedTreatment={selectedTreatment}
            selectedPayment={selectedPayment}
            selectedStatus={selectedStatus}
            onTabChange={(tab) => setActiveTab(tab)}
            onSearchChange={setSearchQuery}
            onDoctorChange={setSelectedDoctor}
            onTreatmentChange={setSelectedTreatment}
            onPaymentChange={setSelectedPayment}
            onStatusChange={setSelectedStatus}
            onRefresh={fetchBookings}
            onExport={() => console.log('Export')}
            onNewAppointment={() => router.push('/book')}
          />

          {activeTab === 'today' && (
            <TodaysQueue
              dark={dark}
              appointments={todayAppointments.map((b) => ({
                id: b.id.toString(),
                bookingId: b.booking_id,
                time: b.preferred_time,
                patientName: b.patient_name,
                treatment: b.treatments,
                doctor: getDoctorName(b),
                appointmentStatus: b.status,
                status: (
                  b.status === 'IN_PROGRESS'
                    ? 'in-treatment'
                    : b.status === 'PENDING_CONFIRMATION'
                      ? 'waiting'
                      : 'confirmed'
                ) as 'confirmed' | 'checked-in' | 'in-treatment' | 'waiting' | 'completed',
                onQuickAction: () => {},
              }))}
            />
          )}

          <AppointmentTable
            dark={dark}
            bookings={bookings}
            loading={loading}
            onRowClick={(booking) => {
              setSelectedRow(booking)
              setIsDrawerOpen(true)
            }}
            onActionClick={(booking) => {
              setSelectedRow(booking)
              setIsDrawerOpen(true)
            }}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
            getAvailableActions={getAvailableActions}
          />

          <RowDetailsDrawer
            dark={dark}
            booking={selectedRow}
            isOpen={isDrawerOpen}
            loading={drawerLoading}
            onClose={() => {
              setIsDrawerOpen(false)
              setSelectedRow(null)
            }}
            onEdit={() => {
              if (selectedRow) router.push(`/book?booking_id=${selectedRow.booking_id}`)
            }}
            onCheckIn={async () => {
              if (!selectedRow) return
              setDrawerLoading(true)
              try {
                const res = await fetch('/api/admin/checkin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ booking_id: selectedRow.booking_id }),
                })
                if (res.ok) {
                  await fetchBookings()
                  setIsDrawerOpen(false)
                }
              } finally {
                setDrawerLoading(false)
              }
            }}
            onInvoice={async () => {
              if (!selectedRow) return
              setDrawerLoading(true)
              try {
                const res = await fetch(`/api/admin/invoices/${selectedRow.booking_id}/download`)
                if (!res.ok) throw new Error('Download failed')
                
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `invoice-${selectedRow.booking_id}.pdf`
                a.click()
                window.URL.revokeObjectURL(url)
              } finally {
                setDrawerLoading(false)
              }
            }}
            onReschedule={() => {
              if (selectedRow) router.push(`/book?booking_id=${selectedRow.booking_id}&action=reschedule`)
            }}
            onCancel={async () => {
              if (!selectedRow) return
              setDrawerLoading(true)
              try {
                const res = await fetch('/api/admin/cancel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ booking_id: selectedRow.booking_id, action: 'cancel' }),
                })
                if (res.ok) {
                  await fetchBookings()
                  setIsDrawerOpen(false)
                }
              } finally {
                setDrawerLoading(false)
              }
            }}
            onDischarge={() => {
              // Pass the booking UUID (selectedRow.booking_id), NOT the numeric row id.
              // discharge_summaries.booking_id is type UUID in Postgres.
              // selectedRow.booking_id contains the actual UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)
              if (selectedRow) router.push(`/admin/discharge-summary?booking_uuid=${encodeURIComponent(selectedRow.booking_id)}`)
            }}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
          />
        </div>
      </div>
    </AdminGuard>
  )
}
