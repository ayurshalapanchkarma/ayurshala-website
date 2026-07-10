'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, Mail, Phone, MapPin, Award } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion } from 'framer-motion'
import DoctorsNavbar from '@/components/admin/DoctorsNavbar'
import { BackButton } from '@/components/inventory/BackButton'

interface Doctor {
  id: string
  name: string
  qualification: string
  specialization: string
  experience_years?: number
  consultation_timings?: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  photo_url?: string
  availability_days?: string
  treatments_offered?: string[]
  bio?: string
  created_at?: string
  updated_at?: string
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    specialization: '',
    experience_years: 0,
    consultation_timings: '',
    phone: '',
    email: '',
    status: 'active' as const,
    photo_url: '',
    availability_days: '',
    treatments_offered: '',
    bio: '',
  })

  // Fetch doctors
  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/doctors')
      const data = await response.json()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchLower) ||
      doctor.specialization.toLowerCase().includes(searchLower) ||
      doctor.email.toLowerCase().includes(searchLower)
    const matchesSpec = !specialization || doctor.specialization === specialization
    const matchesStatus = !status || doctor.status === status
    return matchesSearch && matchesSpec && matchesStatus
  })

  // Get unique specializations
  const specializations = [...new Set(doctors.map((d) => d.specialization))].sort()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/admin/doctors?id=${editingId}` : '/api/admin/doctors'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          treatments_offered: formData.treatments_offered
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save doctor')
      }

      await fetchDoctors()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: '',
        qualification: '',
        specialization: '',
        experience_years: 0,
        consultation_timings: '',
        phone: '',
        email: '',
        status: 'active',
        photo_url: '',
        availability_days: '',
        treatments_offered: '',
        bio: '',
      })
      toast.success(editingId ? 'Doctor updated' : 'Doctor added')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save doctor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (doctor: Doctor) => {
    setFormData({
      name: doctor.name,
      qualification: doctor.qualification,
      specialization: doctor.specialization,
      experience_years: doctor.experience_years || 0,
      consultation_timings: doctor.consultation_timings || '',
      phone: doctor.phone,
      email: doctor.email,
      status: doctor.status,
      photo_url: doctor.photo_url || '',
      availability_days: doctor.availability_days || '',
      treatments_offered: (doctor.treatments_offered || []).join(', '),
      bio: doctor.bio || '',
    })
    setEditingId(doctor.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/doctors?id=${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }
      await fetchDoctors()
      toast.success('Doctor deleted')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete doctor')
    } finally {
      setDeleteConfirm(null)
    }
  }

  return (
    <>
      {/* Doctors Navbar */}
      <DoctorsNavbar />
      
      {/* Main Content - offset below fixed header */}
      <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 dark:from-slate-950 dark:to-orange-950/20 pt-28 sm:pt-32 md:pt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton href="/admin" />

          {/* Filters and Actions */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Plus size={20} />
              Add Doctor
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400"
              />
            </div>

            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Doctors List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12 text-stone-600 dark:text-stone-400">
            No doctors found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-orange-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition"
              >
                {/* Doctor Photo */}
                {doctor.photo_url && (
                  <div className="relative h-40 w-full bg-gradient-to-br from-orange-400 to-orange-600">
                    <Image
                      src={doctor.photo_url}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Doctor Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 dark:text-white">{doctor.name}</h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        {doctor.specialization}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        doctor.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6 text-sm text-stone-600 dark:text-stone-400">
                    {doctor.qualification && (
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-orange-600" />
                        <span>{doctor.qualification}</span>
                      </div>
                    )}
                    {doctor.experience_years && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doctor.experience_years}+ years experience</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-orange-600" />
                      <span>{doctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-orange-600" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="flex-1 px-3 py-2 flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(doctor.id)}
                      className="flex-1 px-3 py-2 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6">
                {editingId ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Phone *"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Specialization *"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Experience (years)"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                </div>

                <textarea
                  placeholder="Bio"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Photo URL"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setFormData({
                        name: '',
                        qualification: '',
                        specialization: '',
                        experience_years: 0,
                        consultation_timings: '',
                        phone: '',
                        email: '',
                        status: 'active',
                        photo_url: '',
                        availability_days: '',
                        treatments_offered: '',
                        bio: '',
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4">Delete Doctor?</h3>
              <p className="text-stone-600 dark:text-stone-400 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
