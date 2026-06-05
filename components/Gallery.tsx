'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// Replace these with real clinic photos in /public/gallery/
const photos = [
  { src: null, label: 'Reception & Waiting Area' },
  { src: null, label: 'Treatment Room' },
  { src: null, label: 'Shirodhara Setup' },
  { src: null, label: 'Panchakarma Suite' },
  { src: null, label: 'Consultation Room' },
  { src: null, label: 'Herbal Preparation' },
]

export default function Gallery() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="gallery" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3">Our Space</p>
          <h2 className="section-title mb-4">Inside Ayurshala</h2>
          <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm leading-relaxed">
            A calm, hygienic, and welcoming environment designed for healing and restoration.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass rounded-2xl overflow-hidden aspect-[4/3] relative group"
            >
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-stone-50">
                  <span className="text-3xl opacity-30">🌿</span>
                  <span className="font-sans text-xs text-stone-300 text-center px-4">{photo.label}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-sans text-xs text-white text-center drop-shadow">{photo.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
