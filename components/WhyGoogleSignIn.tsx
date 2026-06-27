'use client'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function WhyGoogleSignIn() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light mb-6" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>
            Why Google Sign-In?
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: dark ? 'rgba(245,240,232,0.8)' : 'rgba(26,16,8,0.8)' }}>
            Google Sign-In is used only for secure patient authentication. It allows patients to securely access appointments, medical certificates, treatment records, and personal healthcare information.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
