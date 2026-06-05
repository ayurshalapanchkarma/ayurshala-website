'use client'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: 'What are the steps involved in Panchakarma?',
    a: 'Panchakarma includes three steps: (1) Preliminary phase using Snehana (oleation) and Svedana (fomentation), (2) Primary purificatory practices — the five core Panchakarma procedures, and (3) Post-Panchakarma therapies for rejuvenation.',
  },
  {
    q: 'What does Panchakarma do for the body?',
    a: 'It eliminates all impurities and toxins from the body, purifying the mind, body and soul. It achieves a healthy, stress-free state while balancing the vitiated doshas.',
  },
  {
    q: 'Which oils are used in Panchakarma?',
    a: 'A variety of single or medicated oils are used depending on the therapy and individual requirement. Abhyanga may use pure Sesame or Sunflower oil. Sahacharadi tailam and Mahanarayan tailam are also commonly used.',
  },
  {
    q: 'How long does Panchakarma treatment take?',
    a: 'The duration depends on the concern and acuteness of the illness. Due to its elaborate methodology, each treatment plan is personalised by our senior consultant.',
  },
  {
    q: 'Can I do Panchakarma treatment at home?',
    a: 'Certain pre and post procedures can be done at home — consuming Ghee, Snehana, Svedana, and post-operative dietary practices. However, the main operative procedure requires a certified Ayurveda physician.',
  },
  {
    q: 'Who needs Panchakarma?',
    a: 'Panchakarma is for everyone. None of us is exempt from day-to-day hectic lifestyles. It is a dynamic procedure to cleanse the body from inside out, ridding the body and mind of toxins accumulated over time.',
  },
  {
    q: 'Which season is best for Panchakarma?',
    a: 'Vamana is done in Vasant Ritu, phlebotomy in Sharad Ritu, Nasya is for all seasons except cloudy weather, Virechana for Sharad Ritu, and Basti for all seasons. For acute conditions, the physician can perform Panchakarma in any season.',
  },
  {
    q: 'Can we sleep during Panchakarma?',
    a: 'You can rest during Purva (pre-operative) and Paschat (post-operative) care. During the Pradhana (main procedure) you need to be alert, as it can be exhausting while expelling accumulated toxins.',
  },
]

function FAQItem({ faq, i }: { faq: typeof faqs[0]; i: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <span className="font-sans text-sm text-stone-700 group-hover:text-stone-900 transition-colors pr-4">{faq.q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-brand/60 text-xl flex-shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <p className="px-6 pb-5 font-sans text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-4">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="faq" className="py-24 px-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #4a7c59 0%, transparent 70%)' }} />

      <div className="max-w-3xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3">Common Questions</p>
          <h2 className="section-title">Frequently Asked</h2>
        </motion.div>

        {inView && (
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => <FAQItem key={i} faq={f} i={i} />)}
          </div>
        )}
      </div>
    </section>
  )
}
