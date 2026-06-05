'use client'
import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from 'next-themes'

const testimonials = [
  {
    name: 'Chanchal Singh',
    location: 'Noida',
    treatment: 'Panchakarma & Shirodhara',
    rating: 5,
    text: 'I had an amazing experience at Ayurshala. They have well experienced doctors, friendly staff, and highly effective treatment. Panchakarma and Shirodhara therapy were incredibly relaxing and rejuvenating. I saw a great health improvement in just a few weeks. I highly recommend this centre to everyone for natural healing.',
  },
  {
    name: 'Jasleen Khokhar',
    location: 'Noida',
    treatment: 'Ongoing Care',
    rating: 5,
    text: 'Connected with Ayurshala from last two years and must say many of my problems have been addressed and sorted out. Dr. Farha and Dr. Sanjay are so helpful and understanding. The staff is also so helpful. The centre is well organised and hygienic. I highly recommend joining the Ancient Ayurvedic World to improve yourself.',
  },
  {
    name: 'Anoosh Ali Naqvi',
    location: 'Noida',
    treatment: 'IBS & Digestive Care',
    rating: 5,
    text: 'Was struggling with IBS, acidity and constant bloating for years. Got medicines and a strict diet and exercise plan. I followed everything properly and in 3 weeks the burning stopped, motions became normal, no more running to the toilet 5 times a day. Now after 2 months I\'m basically cured. No allopathy needed anymore. Genuine stuff, works if you listen.',
  },
  {
    name: 'Abinsur Mir',
    location: 'Delhi',
    treatment: 'Shirodhara & Abhyanga',
    rating: 5,
    text: 'I was struggling with sleep disturbances for a long time, which affected my daily routine and overall well-being. After starting the recommended treatment along with Shirodhara and Abhyanga, and following all dietary and lifestyle guidance, I am now sleeping much better and feeling noticeably calmer, balanced, and refreshed.',
  },
  {
    name: 'Gaurav Pal Tomar',
    location: 'Noida',
    treatment: 'Ayurvedic Treatment',
    rating: 5,
    text: 'I had a wonderful experience at Ayurshala. The staff is very cooperative, attentive, and ensures you feel comfortable throughout the treatment. Dr. Sanjay is polite, knowledgeable, and takes time to understand your concerns. The center is clean, well-maintained, and has a soothing, positive vibe. Highly recommended!',
  },
  {
    name: 'Heba Fathma',
    location: 'Noida',
    treatment: 'Migraine Treatment',
    rating: 5,
    text: 'Ayurshala is a wonderful place for healing and relaxation. The staff is caring, professional, and knowledgeable. The treatments are authentic, effective, and leave you feeling refreshed and rejuvenated. The centre has been a blessing for my migraine issues. I experienced real relief and lasting comfort. Highly recommended.',
  },
  {
    name: 'Yureed Haider',
    location: 'Noida',
    treatment: 'Panchakarma',
    rating: 5,
    text: 'A variety of therapies are performed exceptionally well and with the highest level of excellence. Both Dr. Farha and Dr. Sanjay Yadav are incredibly friendly and professional. The therapies provided are highly effective, and the results were truly remarkable. I strongly recommend that you visit Ayurshala at least once in your lifetime.',
  },
  {
    name: 'Reshma Naqvi',
    location: 'Noida',
    treatment: 'Arthritis & Skin Care',
    rating: 5,
    text: 'The best Ayurvedic treatment in town! The clinic has excellent facilities with a welcoming environment. Dr. Farha and Dr. Sanjay are highly skilled and experienced doctors. Thanks to Dr. Farha who provided me amazing Ayurvedic medicines and remedies for my arthritis pain and skin problems. Highly recommended!',
  },
  {
    name: 'Komal Yadav',
    location: 'Noida',
    treatment: 'Migraine & Panchakarma',
    rating: 5,
    text: 'I came here for migraine treatment, and within a few weeks of Panchakarma therapy and herbal medicine, the frequency of my headaches has reduced drastically. Grateful to the team!',
  },
  {
    name: 'Mishkah Sayyeda',
    location: 'Noida',
    treatment: 'Cervical Treatment',
    rating: 5,
    text: 'I had a great experience at Ayurshala for my cervical problem. The treatment was very effective, and the staff was kind and helpful. The place is clean and peaceful. I feel much better now and really recommend this center to others.',
  },
  {
    name: 'Anjali Gangwar',
    location: 'Noida',
    treatment: 'Stress & Back Pain',
    rating: 5,
    text: 'I\'ve been visiting this clinic for a few months now and the holistic approach is life changing. The doctors are knowledgeable and caring and the treatments have helped me managing my stress and backache.',
  },
  {
    name: 'Wania Naqvi',
    location: 'Noida',
    treatment: 'Joint Pain',
    rating: 5,
    text: 'I had been struggling with hand joint pain for a long time, but with Ayurveda treatment I finally got relief. The natural approach really worked for me and I\'m so grateful for the improvement I got!',
  },
]

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="#E8621A">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [active, setActive] = useState(0)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <section id="testimonials" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8621A 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(232,98,26,0.7)' }}>Patient Stories</p>
          <h2 className="section-title mb-4">What Our Patients Say</h2>
          <p className="font-sans text-stone-500 max-w-xl mx-auto text-sm leading-relaxed">
            Real experiences from patients who found relief, balance, and renewed vitality through authentic Ayurvedic care.
          </p>
        </motion.div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="glass-strong rounded-3xl p-8 md:p-12 mb-8 relative"
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
            style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(232,98,26,0.10) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(245,166,35,0.07) 0%, transparent 60%)' }} />
          <div className="text-5xl text-brand/20 font-serif leading-none mb-4">"</div>
          <p className="font-serif italic text-xl md:text-2xl text-stone-600 leading-relaxed mb-6">
            {testimonials[active].text}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-sans font-medium" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>{testimonials[active].name}</p>
              <p className="font-sans text-xs text-stone-400">{testimonials[active].location} · {testimonials[active].treatment}</p>
            </div>
            <Stars n={testimonials[active].rating} />
          </div>
        </motion.div>

        <div className="text-center mb-8">
          <a
            href="https://search.google.com/local/reviews?placeid=ChIJq5vLJKvpDDkR_dWR6av70lI"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glass inline-flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Read our Google Reviews
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {testimonials.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`glass rounded-xl p-4 text-left transition-all duration-300 ${
                active === i ? 'border-brand/50 bg-brand/5' : 'border-stone-200 hover:border-stone-300'
              }`}
              style={{ borderWidth: 1, borderStyle: 'solid' }}
            >
              <p className="font-sans text-xs font-medium mb-1" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>{t.name}</p>
              <p className="font-sans text-xs text-stone-400">{t.treatment}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
