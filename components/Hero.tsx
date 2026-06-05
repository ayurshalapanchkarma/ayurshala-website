'use client'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function Hero() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">

      {/* Soft light blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="animate-blob1 absolute top-[5%] left-[10%] w-[550px] h-[550px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #E8621A 0%, transparent 70%)' }} />
        <div className="animate-blob2 absolute top-[30%] right-[5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }} />
        <div className="animate-blob3 absolute bottom-[10%] left-[25%] w-[450px] h-[450px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }} />
        <div className="animate-blob4 absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E11D48 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif italic text-stone-400 text-sm md:text-base mb-8 tracking-wide"
        >
          समदोषः समाग्निश्च समधातु मलःक्रियाः
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong rounded-3xl px-8 py-14 md:px-16 md:py-20 relative"
          style={{
            background: dark
              ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,248,240,0.05) 50%, rgba(255,235,210,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,248,240,0.55) 50%, rgba(255,235,210,0.45) 100%)',
            boxShadow: dark
              ? '0 20px 80px rgba(232,98,26,0.08), 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
            border: dark ? '1px solid rgba(255,255,255,0.1)' : undefined,
          }}
        >
          {/* Radial orange glow top-center */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(232,98,26,0.18) 0%, transparent 65%)' }} />
          {/* Soft teal glow bottom-left */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 0% 120%, rgba(13,148,136,0.10) 0%, transparent 60%)' }} />
          {/* Amber glow bottom-right */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 110%, rgba(245,166,35,0.10) 0%, transparent 60%)' }} />

          <p className="font-sans text-xs tracking-[0.4em] uppercase mb-4" style={{ color: 'rgba(232,98,26,0.8)' }}>
            Ayurveda &amp; Panchakarma Center · Noida
          </p>

          <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-6" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>
            Discover the<br />
            <span style={{ color: '#E8621A' }} className="italic">Healing Power</span><br />
            of Panchakarma
          </h1>

          <p className="text-stone-500 font-sans text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Ancient Ayurvedic wisdom, authentically practiced. Restore balance to your body, mind, and spirit through time-honored Panchakarma therapies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/book" className="btn-glass">Book Appointment</a>
            <a href="#treatments" className="btn-glass" style={{ color: dark ? 'rgba(245,240,232,0.5)' : 'rgba(26,16,8,0.5)', borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}>
              Explore Treatments
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <Image
            src="/ayurshala.png"
            alt="Ayurshala"
            width={80}
            height={80}
            className="object-contain opacity-50"
          />
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-stone-300 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  )
}
