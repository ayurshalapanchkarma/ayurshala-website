'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

const doctors = [
  {
    name: 'Dr. Farha Naqvi',
    title: 'Senior Ayurvedic Diet & Lifestyle Consultant',
    qualifications: 'BUMS, MHA, MDPK | Certified Yoga Trainer | Diploma in Ayurvedic Diet & Nutrition',
    experience: '20+ Years',
    speciality: 'Ayurvedic Diet & Nutrition, Lifestyle Counseling, Yoga-Based Wellness, Preventive Healthcare',
    bio: 'Dr. Farha Naqvi specializes in Ayurvedic nutrition, therapeutic diet planning, and holistic lifestyle management. Her approach combines traditional Ayurvedic principles with personalized wellness strategies to help patients improve digestion, metabolism, immunity, and overall well-being. She also provides guidance on yoga, preventive healthcare, and sustainable lifestyle practices for long-term health.',
    icon: '👩⚕️',
    image: '/farha.jpg',
  },
  {
    name: 'Dr. Sanjay Yadav',
    title: 'Sr. Ayurveda Physician & Panchakarma Specialist',
    qualifications: 'BAMS, PGDHHM, MIA (Neuro Acupuncture) | Certification in Diabetes Management (IIAR)',
    experience: '15+ Years',
    speciality: 'Panchakarma Therapy, Vidh Karma, Neuro Acupuncture, Neuro Disorders, Cardiac Care',
    bio: 'Dr. Sanjay Yadav is an experienced Ayurvedic physician specializing in Panchakarma therapies, Vidh Karma, and the management of chronic neurological and cardiac conditions. His treatment approach integrates classical Ayurveda, Panchakarma, and acupuncture techniques to support recovery, pain management, and overall health restoration.',
    icon: '👨⚕️',
    image: '/dr-sanjay.jpg',
  },
]

export default function Doctors() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <section id="doctors" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8621A 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3">Our Physicians</p>
          <h2 className="section-title mb-4">Meet the Healers</h2>
          <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm leading-relaxed">
            Certified Ayurvedic physicians with decades of combined experience in classical Panchakarma practice.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doc, i) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="glass-strong rounded-3xl p-8 relative overflow-hidden"
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
                style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(232,98,26,0.12) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(13,148,136,0.07) 0%, transparent 60%)' }} />

              {/* Avatar / photo */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 overflow-hidden"
                style={{
                  background: dark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,248,240,0.05) 50%, rgba(255,235,210,0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,248,240,0.55) 50%, rgba(255,235,210,0.45) 100%)'
                }}>
                {doc.image ? (
                  <Image src={doc.image} alt={doc.name} width={80} height={80} className="w-full h-full object-cover object-top" />
                ) : (
                  doc.icon
                )}
              </div>

              <h3 className="font-serif text-2xl mb-1" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>{doc.name}</h3>
              <p className="font-sans text-xs text-brand/60 tracking-wider uppercase mb-1">{doc.title}</p>
              <p className="font-sans text-xs text-stone-400 mb-4">{doc.qualifications}</p>

              <p className="font-sans text-sm text-stone-500 leading-relaxed mb-5">{doc.bio}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3">
                  <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">Experience</p>
                  <p className="font-sans text-sm text-stone-600">{doc.experience}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">Speciality</p>
                  <p className="font-sans text-xs text-stone-500 leading-relaxed">{doc.speciality}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <a href="/book" className="btn-glass inline-block">Book a Consultation</a>
        </motion.div>
      </div>
    </section>
  )
}
