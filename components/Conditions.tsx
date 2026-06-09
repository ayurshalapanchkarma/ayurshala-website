'use client'
import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from 'next-themes'

const conditions = [
  { category: 'Spine & Joints', icon: '', items: ['Lower Back Pain', 'Cervical Spondylosis', 'Sciatica', 'Knee Osteoarthritis', 'Frozen Shoulder', 'Disc Prolapse', 'Rheumatoid Arthritis', 'Gout'] },
  { category: 'Neurological', icon: '', items: ['Migraine', 'Insomnia', 'Anxiety & Depression', 'Stress Disorders', 'PTSD & OCD', 'Facial Paralysis', 'Hemiplegia', 'Vertigo'] },
  { category: 'Digestive', icon: '', items: ['IBS & Colitis', 'Chronic Constipation', 'Acidity & GERD', 'Liver Disorders', 'Piles & Fistula', 'Loss of Appetite', 'Bloating', 'Malabsorption'] },
  { category: 'Skin & Hair', icon: '', items: ['Psoriasis', 'Eczema', 'Acne & Pigmentation', 'Hair Fall', 'Premature Greying', 'Dry Skin', 'Urticaria', 'Vitiligo'] },
  { category: 'Respiratory', icon: '', items: ['Chronic Sinusitis', 'Allergic Rhinitis', 'Asthma', 'Frequent Colds', 'Nasal Polyps', 'Tonsillitis', 'Bronchitis', 'Ear Infections'] },
  { category: 'Lifestyle & Metabolic', icon: '', items: ['Obesity', 'Diabetes (Type 2)', 'Thyroid Disorders', 'PCOD / PCOS', 'Hypertension', 'High Cholesterol', 'Chronic Fatigue', 'Immunity Issues'] },
]

export default function Conditions() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <section id="conditions" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

      <div className="w-full max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(232,98,26,0.7)' }}>Conditions We Treat</p>
          <h2 className="section-title mb-4">Find Relief From What Ails You</h2>
          <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm leading-relaxed">
            Ayurveda addresses the root cause, not just the symptom. These are the conditions our patients most commonly find lasting relief from.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {conditions.map((cat, i) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass-card"
            >
              <div className="flex items-center gap-3 mb-4">
                {cat.icon && <span className="text-2xl">{cat.icon}</span>}
                <h3 className="font-serif text-lg" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>{cat.category}</h3>
              </div>
              <ul className="space-y-1.5">
                {cat.items.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#E8621A', opacity: 0.6 }} />
                    <span className="font-sans text-sm text-stone-500">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="font-sans text-sm text-stone-400 mb-4">Don't see your condition? We treat many more.</p>
          <a href="/book" className="btn-glass inline-block">Book a Consultation</a>
        </motion.div>
      </div>
    </section>
  )
}
