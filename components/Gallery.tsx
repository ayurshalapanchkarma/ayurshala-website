'use client'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const photos = [
  { src: '/gallery/reception.jpg', alt: 'Reception' },
  { src: '/gallery/waiting_area.jpg', alt: 'Waiting Area' },
  { src: '/gallery/consultation_room.jpg', alt: 'Consultation Room' },
  { src: '/gallery/consultation_room_01.jpg', alt: 'Consultation Room' },
  { src: '/gallery/male_panchakarma_room.jpg', alt: 'Male Panchakarma Room' },
  { src: '/gallery/male_panchakarma_room_01.jpg', alt: 'Male Panchakarma Room' },
  { src: '/gallery/female_panchakarma_room.jpg', alt: 'Female Panchakarma Room' },
  { src: '/gallery/yoga_area.jpg', alt: 'Yoga Area' },
  { src: '/gallery/yoga_area_01.jpg', alt: 'Yoga Area' },
  { src: '/gallery/yoga_area_02.jpg', alt: 'Yoga Area' },
  { src: '/gallery/washroom.jpg', alt: 'Washroom' },
  { src: '/gallery/Doctors_Degrees.jpg', alt: "Doctor's Degrees" },
  { src: '/gallery/Doctors_Degrees_01.jpg', alt: "Doctor's Degrees" },
]

const videos = [
  { src: 'qrnpi4Sr60I', alt: 'Inside View' },
  { src: 'v-E6v4drW8I', alt: 'Clinic Tour' },
]

function Slideshow() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % photos.length), [])

  useEffect(() => {
    if (paused || lightbox) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [paused, lightbox, next])

  const photo = photos[current]

  return (
    <>
      <div
        className="relative rounded-3xl overflow-hidden cursor-pointer"
        style={{ height: '480px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onClick={() => setLightbox(photo.src)}
      >
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
            <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-cover" priority={current === 0} />
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}>
              <p className="text-white text-sm font-medium">{photo.alt}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10 text-xl"
          onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + photos.length) % photos.length) }}>‹</button>
        <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10 text-xl"
          onClick={e => { e.stopPropagation(); next() }}>›</button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {photos.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-brand' : 'w-2 h-2 bg-stone-300'}`} />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-4xl" style={{ height: '85vh' }} onClick={e => e.stopPropagation()}>
            <Image src={lightbox} alt="Gallery" fill className="object-contain rounded-2xl" />
          </div>
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}
    </>
  )
}

export default function Gallery() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [videoLightbox, setVideoLightbox] = useState<string | null>(null)

  return (
    <>
      <section id="gallery" className="py-24 px-6 relative overflow-hidden" ref={ref}>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-16">
            <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3">Inside Ayurshala</p>
            <h2 className="section-title mb-4">Our Clinic &amp; Therapies</h2>
            <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm leading-relaxed">
              A glimpse into our healing space — where ancient wisdom meets compassionate care.
            </p>
          </motion.div>

          {/* Photo slideshow */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }}>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-stone-400 mb-4">Clinic Photos</p>
            <Slideshow />
          </motion.div>

          {/* Videos */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="mt-16">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-stone-400 mb-4">Videos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map(v => (
                <div key={v.src} className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ height: '260px' }}
                  onClick={() => setVideoLightbox(v.src)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${v.src}/hqdefault.jpg`} alt={v.alt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{v.alt}</div>
                </div>
              ))}
            </div>
          </motion.div>



        </div>
      </section>

      {/* Video lightbox */}
      {videoLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setVideoLightbox(null)}>
          <div className="relative w-full max-w-3xl" style={{ aspectRatio: '16/9' }} onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${videoLightbox}?autoplay=1`}
              className="w-full h-full rounded-2xl"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setVideoLightbox(null)}>×</button>
        </div>
      )}

    </>
  )
}
