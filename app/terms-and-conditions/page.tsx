'use client'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'

export default function TermsAndConditions() {
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
          <h1 className={`text-4xl sm:text-5xl font-serif mb-2 ${headingColor}`}>Terms & Conditions</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>Last Updated: June 14, 2026</p>
        </div>

        {/* Content */}
        <div className={`rounded-3xl backdrop-blur-2xl ${cardBg} border ${borderColor} p-8 sm:p-12 space-y-8`}>

          {/* Section 1 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>1. Acceptance of Terms</h2>
            <p className={textColor}>
              By accessing and using the Ayurshala Panchakarma Center website and booking services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>2. Appointment Booking Policy</h2>
            <p className={`${textColor} mb-3`}>
              When you book an appointment through our platform:
            </p>
            <ul className={`list-disc list-inside space-y-2 ml-4 ${textColor}`}>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for ensuring the accuracy of your contact details</li>
              <li>Appointments are subject to availability and clinic approval</li>
              <li>You will receive confirmation via email and SMS</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>3. Payment Terms</h2>
            <div className={`space-y-3 ${textColor}`}>
              <p><strong>Online Payments:</strong> Online payments are processed securely through Cashfree Payments. By making an online payment, you authorize the charge to your payment method.</p>
              <p><strong>Cash on Arrival:</strong> Payment can also be made in cash at the clinic. The full appointment amount must be paid upon arrival.</p>
              <p><strong>Currency:</strong> All prices are listed in Indian Rupees (INR).</p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>4. Cancellation Policy</h2>
            <p className={`${textColor} mb-3`}>
              You may cancel your appointment at any time. However, please note:
            </p>
            <ul className={`list-disc list-inside space-y-2 ml-4 ${textColor}`}>
              <li>Cancellations made 48 hours before the appointment will be processed for refund</li>
              <li>Cancellations made less than 48 hours before may result in a cancellation fee</li>
              <li>Refunds will be processed to the original payment method</li>
              <li>For cash payments, refunds will be issued at the clinic</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>5. Rescheduling Policy</h2>
            <p className={`${textColor} mb-3`}>
              You may request to reschedule your appointment:
            </p>
            <ul className={`list-disc list-inside space-y-2 ml-4 ${textColor}`}>
              <li>Rescheduling requests must be made at least 24 hours before your appointment</li>
              <li>Rescheduling is subject to clinic availability and approval</li>
              <li>Approved reschedules will be confirmed via email</li>
              <li>Repeated rescheduling may result in cancellation</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>6. Refund Policy</h2>
            <div className={`space-y-3 ${textColor}`}>
              <p>
                Refunds are processed based on the payment method used and the original transaction amount recorded in our system:
              </p>
              <p><strong>Online Payments:</strong> Refunds will be credited to the original payment method within 5-7 business days.</p>
              <p><strong>Cash Payments:</strong> Refunds will be issued at the clinic location.</p>
              <p>No refunds will be issued for missed appointments without valid cancellation notice.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>7. Patient Responsibilities</h2>
            <p className={`${textColor} mb-3`}>
              As a patient, you are responsible for:
            </p>
            <ul className={`list-disc list-inside space-y-2 ml-4 ${textColor}`}>
              <li>Arriving on time for your appointment</li>
              <li>Providing accurate medical history information</li>
              <li>Informing us of any allergies or medications</li>
              <li>Following pre-appointment instructions if provided</li>
              <li>Maintaining the confidentiality of your account</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>8. Limitation of Liability</h2>
            <p className={textColor}>
              Ayurshala Panchakarma Center provides services on an "as-is" basis. We do not guarantee specific medical outcomes. The services provided are not a substitute for professional medical advice. Always consult with a qualified healthcare provider before making medical decisions.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>9. Intellectual Property</h2>
            <p className={textColor}>
              All content on this website, including text, graphics, logos, and images, is the property of Ayurshala Panchakarma Center or its content suppliers and is protected by international copyright laws. Unauthorized use is prohibited.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className={`text-2xl font-serif mb-4 ${headingColor}`}>10. Contact Information</h2>
            <div className={`space-y-2 ${textColor}`}>
              <p><strong>Ayurshala Panchakarma Center</strong></p>
              <p>SP-28, Wajidpur, Sector-130, Noida – 201301</p>
              <p>Email: <a href="mailto:ayurshalapanchkarma@gmail.com" className={linkColor}>ayurshalapanchkarma@gmail.com</a></p>
              <p>Phone: <a href="tel:+919821224767" className={linkColor}>+91-9821224767</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
