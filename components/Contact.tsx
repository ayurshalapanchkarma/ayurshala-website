'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Clock, MapPin, Phone, Mail, FileText, Send, X, CheckCircle, AlertCircle, Calendar, Loader } from 'lucide-react'

const services = [
  'Lifestyle Consultation', 'Nadi Pariksha (Pulse Diagnosis)',
  'Panchakarma', 'Yoga', 'Diet Consultation (Pathya/Apathya)',
  'Ritu Shodhna', 'Chronic Disease Management',
  'Preconception & Post-conception Care', 'Swarna Prashan',
]

type FormErrors = { name?: string; email?: string; phone?: string; message?: string }

export default function Contact() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim() || formData.name.length < 2) errors.name = 'Name must be at least 2 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.message.trim() || formData.message.length < 10) errors.message = 'Message must be at least 10 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', message: '' })
        setTimeout(() => { setShowForm(false); setSubmitStatus('idle') }, 3000)
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    }
    setSubmitting(false)
  }

  const cardStyle = {
    background: dark
      ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,248,240,0.05) 50%, rgba(255,235,210,0.04) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,248,240,0.55) 50%, rgba(255,235,210,0.45) 100%)',
    boxShadow: dark
      ? '0 12px 48px rgba(232,98,26,0.06), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 12px 48px rgba(232,98,26,0.10), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : undefined,
  }

  return (
    <>
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-56 sm:w-96 md:w-[500px] h-56 sm:h-96 md:h-[500px] rounded-full opacity-10 pointer-events-none hidden sm:block"
          style={{ background: 'radial-gradient(circle, #E8621A 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
        <div className="absolute top-0 left-0 w-48 sm:w-80 md:w-[400px] h-48 sm:h-80 md:h-[400px] rounded-full opacity-10 pointer-events-none hidden sm:block"
          style={{ background: 'radial-gradient(circle, #4a7c59 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />

        <div className="w-full max-w-6xl mx-auto px-2 sm:px-0" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3">Get In Touch</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight mb-4" style={{ color: '#1a1008' }}>Begin Your Healing Journey</h2>
            <p className="font-sans text-xs sm:text-sm text-stone-500 max-w-2xl mx-auto leading-relaxed">
              Our certified Ayurvedic physicians are ready to guide you. Book a consultation and take the first step toward restored balance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Contact Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass-strong rounded-3xl p-8 md:p-10 relative"
              style={cardStyle}
            >
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(232,98,26,0.10) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(13,148,136,0.07) 0%, transparent 60%)' }} />

              <h3 className="font-serif text-2xl mb-8" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>Contact Info</h3>

              <div className="space-y-6">
                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-brand/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">Opening Hours</p>
                    <p className="font-sans text-stone-600 text-sm">Mon – Thu & Sat: 9:00 AM – 7:00 PM</p>
                    <p className="font-sans text-stone-600 text-sm">Sunday: 10:00 AM – 2:00 PM</p>
                    <p className="font-sans text-stone-600 text-sm">Friday: Closed</p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-brand/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">Address</p>
                    <p className="font-sans text-stone-600 text-sm leading-relaxed">
                      SP-28, Wajidpur, Sector-130<br />Noida, Uttar Pradesh — 201301
                    </p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-brand/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">Phone</p>
                    <a href="tel:+919821224767" className="block font-sans text-stone-600 text-sm hover:text-brand transition-colors">+91-9821224767</a>
                    <a href="tel:+919773853554" className="block font-sans text-stone-600 text-sm hover:text-brand transition-colors">+91-9773853554</a>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-brand/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-1">Email</p>
                    <a href="mailto:ayurshalapanchkarma@gmail.com" className="font-sans text-stone-600 text-sm hover:text-brand transition-colors break-all">
                      ayurshalapanchkarma@gmail.com
                    </a>
                  </div>
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} className="mt-10">
                <a href="/book" className="btn-glass w-full text-center block flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Book Appointment
                </a>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowForm(!showForm)}
                className="btn-glass w-full text-center mt-3 font-sans text-sm py-2 border-brand/40 hover:border-brand/70 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Message
              </motion.button>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="glass rounded-3xl p-8 md:p-10"
            >
              {!showForm ? (
                <div>
                  <h3 className="font-serif text-2xl mb-6" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>What We Offer</h3>
                  <ul className="space-y-3">
                    {services.map((s) => (
                      <motion.li key={s} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand/50 flex-shrink-0" />
                        <span className="font-sans text-sm text-stone-600">{s}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <div className="mt-8 glass rounded-2xl p-5">
                    <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-2">Vision</p>
                    <p className="font-sans text-sm text-stone-500 leading-relaxed italic">
                      "To impart quality Panchakarma education and apply scientific therapy in clinical practice to relinquish dosha for core care of diseases."
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-serif text-2xl" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>Send us a Message</h3>
                  
                  <div>
                    <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Name *"
                      className={`w-full glass rounded-xl px-4 py-3 font-sans text-sm bg-transparent placeholder-stone-400 focus:outline-none transition-colors border ${dark ? 'text-stone-200 border-white/10' : 'text-stone-700 border-stone-200'} ${formErrors.name ? 'border-red-400' : ''}`}
                    />
                    {formErrors.name && <p className="font-sans text-xs text-red-400 mt-1">✗ {formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Your Email *"
                      className={`w-full glass rounded-xl px-4 py-3 font-sans text-sm bg-transparent placeholder-stone-400 focus:outline-none transition-colors border ${dark ? 'text-stone-200 border-white/10' : 'text-stone-700 border-stone-200'} ${formErrors.email ? 'border-red-400' : ''}`}
                    />
                    {formErrors.email && <p className="font-sans text-xs text-red-400 mt-1">✗ {formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="font-sans text-xs text-stone-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><Send className="w-3 h-3" /> Message</label>
                    <textarea
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value.slice(0, 500) })}
                      placeholder="Your Message *"
                      rows={3}
                      className={`w-full glass rounded-xl px-4 py-3 font-sans text-sm bg-transparent placeholder-stone-400 focus:outline-none transition-colors border resize-none ${dark ? 'text-stone-200 border-white/10' : 'text-stone-700 border-stone-200'} ${formErrors.message ? 'border-red-400' : ''}`}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className={`font-sans text-xs ${formData.message.length > 450 ? 'text-amber-500' : 'text-stone-400'}`}>{formData.message.length}/500</p>
                      {formErrors.message && <p className="font-sans text-xs text-red-400">✗ {formErrors.message}</p>}
                    </div>
                  </div>

                  {submitStatus === 'success' && <p className="font-sans text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-2 text-center flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Message sent! We'll get back soon.</p>}
                  {submitStatus === 'error' && <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> Error sending message. Try again.</p>}

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-glass py-3 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Message</>}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 glass rounded-full px-4 py-3 font-sans text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 glass rounded-3xl overflow-hidden"
            style={{ height: '340px' }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.4935002688903!2d77.38978277553757!3d28.494796475740262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce9ab24cb9bab%3A0x52d2fbabe991d5fd!2sAyurshala%20Ayurveda%20and%20Panchakarma%20Center!5e0!3m2!1sen!2sin!4v1780323078912!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ayurshala Location"
            />
          </motion.div>
        </div>
      </section>

      <footer className="px-6 pb-6 pt-2">
        <div className="max-w-6xl mx-auto rounded-3xl px-8 py-5"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
            border: '1px solid rgba(232,98,26,0.18)',
            boxShadow: '0 8px 32px rgba(232,98,26,0.06), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={280} height={80} className="object-contain h-16 w-auto" />

            <div className="flex items-center gap-4">
              <a href="https://www.youtube.com/@AyurshalaPanchkarma-bm6cq" target="_blank" rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 glass rounded-full flex items-center justify-center text-stone-700 hover:text-brand hover:border-brand/40 transition-all duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/ayurshala.panchakarma" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 glass rounded-full flex items-center justify-center text-stone-700 hover:text-brand hover:border-brand/40 transition-all duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/ayurshala.panchakarma" target="_blank" rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 glass rounded-full flex items-center justify-center text-stone-700 hover:text-brand hover:border-brand/40 transition-all duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://wa.me/919821224767" target="_blank" rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 glass rounded-full flex items-center justify-center text-stone-700 hover:text-brand hover:border-brand/40 transition-all duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>

            <div className="flex gap-6">
              <a href="tel:+919821224767" className="font-sans text-xs text-stone-900 hover:text-brand transition-colors">Call Us</a>
              <a href="mailto:ayurshalapanchkarma@gmail.com" className="font-sans text-xs text-stone-900 hover:text-brand transition-colors">Email</a>
              <a href="/book" className="font-sans text-xs text-stone-900 hover:text-brand transition-colors">Book</a>
            </div>
          </div>
          <div className="border-t border-stone-200/50 pt-2 text-center">
            <p className="font-sans text-xs text-stone-900">
              © {new Date().getFullYear()} Ayurshala Panchakarma Center. All Rights Reserved. · SP-28, Wajidpur, Sector-130, Noida — 201301
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
