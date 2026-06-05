'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

const stages = [
  {
    num: '01',
    title: 'Purva Karma',
    subtitle: 'Preparatory Phase',
    desc: 'Snehana (oleation) and Swedana (fomentation) loosen and liquefy toxins, preparing the body for deep cleansing.',
  },
  {
    num: '02',
    title: 'Pradhan Karma',
    subtitle: 'Main Purification',
    desc: 'The five core procedures — Vamana, Virechana, Basti, Nasya, Raktamokshana — expel toxins from every channel.',
  },
  {
    num: '03',
    title: 'Uttar Karma',
    subtitle: 'Post-Therapy Regimen',
    desc: 'Dietary guidelines and lifestyle practices restore digestive capacity and rebuild tissues with renewed strength.',
  },
]

const values = [
  { icon: '🌿', label: 'Hope' },
  { icon: '💚', label: 'Health' },
  { icon: '☀️', label: 'Happiness' },
  { icon: '🕊️', label: 'Holiness' },
  { icon: '🎋', label: 'Harmony' },
]

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <section id="about" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8621A 0%, transparent 70%)', transform: 'translate(-40%, 40%)' }} />

      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3">Our Story</p>
          <h2 className="section-title mb-4">The Panchakarma Journey</h2>
          <p className="font-sans text-stone-500 max-w-2xl mx-auto text-sm leading-relaxed">
            Ayurveda — the "knowledge of life" — has guided humanity for over 3,000 years. At Ayurshala, we practice it as the ancient texts prescribe: methodically, authentically, and with complete care for each individual.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stages.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="glass-card relative overflow-hidden"
            >
              <span className="absolute top-4 right-4 font-serif text-6xl font-light text-stone-200 select-none">{s.num}</span>
              <p className="font-sans text-xs tracking-widest text-brand/60 uppercase mb-2">{s.subtitle}</p>
              <h3 className="font-serif text-2xl mb-3" style={{ color: '#1a1008' }}>{s.title}</h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="glass-strong rounded-3xl p-10 md:p-14 text-center mb-16 relative"
          style={{
            background: dark
              ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,248,240,0.05) 50%, rgba(255,235,210,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,248,240,0.55) 50%, rgba(255,235,210,0.45) 100%)',
            boxShadow: dark
              ? '0 12px 48px rgba(232,98,26,0.06), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 12px 48px rgba(232,98,26,0.10), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
            border: dark ? '1px solid rgba(255,255,255,0.1)' : undefined,
          }}
        >
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(232,98,26,0.10) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(13,148,136,0.07) 0%, transparent 60%)' }} />
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/50 mb-6">Charaka Samhita</p>
          <blockquote className="font-serif italic text-xl md:text-2xl text-stone-600 leading-relaxed max-w-3xl mx-auto">
            "In a person whose digestive system has been cleansed and purified, the metabolism is stimulated, disease is reduced, and normal health is maintained. Sense organs, mind, intellect, and complexion are improved; strength, good nourishment, and potency are the result."
          </blockquote>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-center"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/50 mb-6">Our Mission — The 5H Values</p>
          <div className="flex flex-wrap justify-center gap-4">
            {values.map(v => (
              <div key={v.label} className="glass rounded-2xl px-6 py-4 flex flex-col items-center gap-2 min-w-[90px]">
                <span className="text-2xl">{v.icon}</span>
                <span className="font-serif text-stone-600 text-sm">{v.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
