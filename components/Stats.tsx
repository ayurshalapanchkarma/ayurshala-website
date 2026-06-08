'use client'
import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from 'next-themes'

const stats = [
  { value: '500+', label: 'Patients Treated' },
  { value: '15+',   label: 'Years Experience' },
  { value: '19',    label: 'Authentic Therapies' },
  { value: '100%',  label: 'Natural & Authentic' },
]

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <section ref={ref} className="py-6 px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-6xl mx-auto glass rounded-2xl px-6 py-5"
        style={{
          borderColor: 'rgba(232,98,26,0.2)',
          background: dark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,248,240,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,248,240,0.55) 100%)',
          boxShadow: dark
            ? '0 8px 32px rgba(232,98,26,0.06), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 8px 32px rgba(232,98,26,0.08), inset 0 1px 0 rgba(255,255,255,1)',
          border: dark ? '1px solid rgba(255,255,255,0.1)' : undefined,
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-0 md:divide-x md:divide-stone-200">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="text-center px-4 py-2"
            >
              <p className="font-serif text-3xl md:text-4xl font-light" style={{ color: '#E8621A' }}>{s.value}</p>
              <p className="font-sans text-xs text-stone-400 tracking-wider uppercase mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
