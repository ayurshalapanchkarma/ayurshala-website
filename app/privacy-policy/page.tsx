'use client'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'

export default function PrivacyPolicy() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  const textColor = isDark ? 'text-gray-200' : 'text-stone-800'
  const headingColor = isDark ? 'text-white' : 'text-stone-950'
  const linkColor = isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
  const bgClass = isDark ? 'bg-slate-950' : 'bg-orange-50'
  const cardBg = isDark ? 'bg-slate-900/60' : 'bg-white/70'
  const borderColor = isDark ? 'border-slate-700/50' : 'border-white/30'

  return (
    <div className={`min-h-screen ${bgClass} transition-colors`}>
      <GlassBackground />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="h-12 w-auto mx-auto mb-4" />
          <h1 className={`text-4xl sm:text-5xl font-serif mb-2 ${headingColor}`}>Privacy Policy</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>Last Updated: June 14, 2026</p>
        </div>

        {/* Content */}
        <div className={`rounded-3xl backdrop-blur-2xl ${cardBg} border ${borderColor} p-8 sm:p-12 space-y-8`}>

          {/* Section 1 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>1. Introduction</h2>
            <p className={textColor}>
              Ayurshala Panchakarma Center ("we", "us", "our", or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>2. Information We Collect</h2>
            <div className={`space-y-3 ${textColor}`}>
              <p><strong>Personal Identification Information:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Date of Birth (if provided)</li>
              </ul>
              <p className="mt-4"><strong>Appointment Information:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Preferred appointment dates and times</li>
                <li>Selected treatments</li>
                <li>Medical history (if shared)</li>
              </ul>
              <p className="mt-4"><strong>Payment Information:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment method and transaction details</li>
                <li>Billing address (if applicable)</li>
              </ul>
              <p className="mt-4"><strong>Google Sign-In Information:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your Google profile name</li>
                <li>Google profile email</li>
                <li>Google profile picture (optional)</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>3. How We Use Your Information</h2>
            <p className={textColor}>We use the information we collect to:</p>
            <ul className={`list-disc list-inside space-y-2 ml-4 mt-3 ${textColor}`}>
              <li>Process and manage your appointments</li>
              <li>Send appointment confirmations and reminders</li>
              <li>Process payments securely</li>
              <li>Improve our services and website</li>
              <li>Communicate with you about updates or changes</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>4. Payment Information</h2>
            <p className={textColor}>
              Payment transactions are processed through Cashfree Payments. We do not store complete credit card information on our servers. Cashfree handles all payment processing in compliance with PCI DSS standards. For online payments, you will be redirected to Cashfree's secure payment gateway.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>5. Data Security</h2>
            <p className={textColor}>
              We implement appropriate technical and organizational measures to protect your personal information. Your data is encrypted during transmission and stored securely in our database hosted on Supabase, which complies with international data protection standards.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>6. Third-Party Services</h2>
            <div className={`space-y-4 ${textColor}`}>
              <div>
                <p><strong>Google OAuth:</strong> We use Google Sign-In for authentication. Google's privacy policy governs the data they collect.</p>
              </div>
              <div>
                <p><strong>Supabase:</strong> We use Supabase for database hosting and real-time features. Supabase complies with GDPR and other data protection regulations.</p>
              </div>
              <div>
                <p><strong>Cashfree Payments:</strong> Payment processing is handled by Cashfree, which maintains PCI DSS compliance.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>7. Cookies and Analytics</h2>
            <p className={textColor}>
              Our website uses cookies to enhance your experience. These cookies help us understand how you use our site and remember your preferences. You can disable cookies through your browser settings, but some features may not work properly.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>8. Your Rights</h2>
            <p className={textColor}>You have the right to:</p>
            <ul className={`list-disc list-inside space-y-2 ml-4 mt-3 ${textColor}`}>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability where applicable</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>9. Contact Information</h2>
            <div className={`space-y-2 ${textColor}`}>
              <p><strong>Ayurshala Panchakarma Center</strong></p>
              <p>SP-28, Wajidpur, Sector-130, Noida – 201301</p>
              <p>Email: <a href="mailto:admin@ayurshalapanchkarma.com" className={linkColor}>admin@ayurshalapanchkarma.com</a></p>
              <p>Phone: <a href="tel:+919821224767" className={linkColor}>+91-9821224767</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
