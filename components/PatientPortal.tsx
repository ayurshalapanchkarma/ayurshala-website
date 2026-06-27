'use client'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Calendar, FileText, User } from 'lucide-react'

export default function PatientPortal() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  const features = [
    { icon: Calendar, text: 'Book appointments' },
    { icon: Lock, text: 'Sign in securely with Google' },
    { icon: Calendar, text: 'View upcoming appointments' },
    { icon: FileText, text: 'Access treatment history' },
    { icon: FileText, text: 'Download treatment certificates' },
    { icon: FileText, text: 'Download medical certificates' },
    { icon: FileText, text: 'View prescriptions' },
    { icon: User, text: 'Update profile information' },
  ]

  return (
    <section id="patient-portal" className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light mb-4" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>
            Secure Patient Portal
          </h2>
          <p className="text-lg sm:text-xl" style={{ color: dark ? 'rgba(245,240,232,0.7)' : 'rgba(26,16,8,0.7)' }}>
            Manage your healthcare online with a secure patient account
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="glass-strong rounded-2xl sm:rounded-3xl p-8 sm:p-12 mb-12 sm:mb-16"
          style={{
            background: dark
              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,248,240,0.03) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,248,240,0.3) 100%)',
          }}
        >
          <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: dark ? 'rgba(245,240,232,0.8)' : 'rgba(26,16,8,0.8)' }}>
            Ayurshala Panchakarma Center provides a secure online patient portal that allows patients to:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <feature.icon size={20} style={{ color: '#E8621A' }} className="flex-shrink-0" />
                <span style={{ color: dark ? 'rgba(245,240,232,0.7)' : 'rgba(26,16,8,0.7)' }}>{feature.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="border-t pt-8" style={{ borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <p className="text-sm sm:text-base italic" style={{ color: dark ? 'rgba(245,240,232,0.6)' : 'rgba(26,16,8,0.6)' }}>
              Google Sign-In is used only to securely authenticate patients and provide access to their personal healthcare information.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-2"
        >
          <Link href="/login" className="btn-glass text-xs sm:text-sm py-3 sm:py-4 px-8 sm:px-10 text-center whitespace-nowrap">
            Access Patient Portal
          </Link>
          <Link href="/book" className="btn-glass text-xs sm:text-sm py-3 sm:py-4 px-8 sm:px-10 text-center whitespace-nowrap" style={{ color: dark ? 'rgba(245,240,232,0.5)' : 'rgba(26,16,8,0.5)', borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}>
            Book Appointment
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
