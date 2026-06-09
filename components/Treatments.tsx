'use client'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const categories = ['All', 'Panchakarma', 'Basti Therapies', 'Head & Neck', 'Modern & Regenerative']

const treatments = [
  // ── PANCHAKARMA CORE ──
  {
    name: 'Shirodhara',
    sanskrit: 'शिरोधारा',
    category: 'Head & Neck',
    tagline: 'The River of Stillness',
    desc: 'A continuous, rhythmic stream of warm medicated oil flows over the forehead — the seat of the third eye — for 45 to 60 minutes. This ancient technique silences the nervous system at its root, dissolving stress, anxiety, and mental fatigue that modern medicine struggles to reach.',
    benefits: ['Deep insomnia relief', 'Anxiety & stress reduction', 'Migraine & vertigo', 'Hypertension control', 'Sharpens memory & focus', 'Awakens intuition'],
    icon: '',
    duration: '45–60 min',
  },
  {
    name: 'Abhyanga',
    sanskrit: 'अभ्यंग',
    category: 'Panchakarma',
    tagline: 'The Full-Body Renewal',
    desc: 'Warm, herb-infused oils are worked into every inch of the body — from scalp to soles — using long, intentional strokes that follow the direction of body hair and energy channels. More than a massage, Abhyanga is a conversation between the oil and your tissues, coaxing toxins out while flooding cells with nourishment.',
    benefits: ['Full-body detox', 'Balances Vata & Pitta', 'Reduces hyperpigmentation', 'Improves joint lubrication', 'Promotes lymphatic drainage', 'Induces deep sleep'],
    icon: '',
    duration: '60 min',
  },
  {
    name: 'Swedana',
    sanskrit: 'स्वेदन',
    category: 'Panchakarma',
    tagline: 'The Herbal Steam Purge',
    desc: 'Following oleation, the body is enveloped in medicated steam drawn from a decoction of carefully chosen herbs. The heat widens the body\'s channels, allowing loosened toxins to flow freely back to the digestive tract for elimination. It melts stiffness, restores warmth to cold Vata conditions, and prepares the body for deeper Panchakarma procedures.',
    benefits: ['Opens body channels', 'Relieves muscle stiffness', 'Improves circulation', 'Reduces Kapha & Vata', 'Prepares for Panchakarma', 'Cleanses skin'],
    icon: '',
    duration: '20–30 min',
  },
  {
    name: 'Vamana',
    sanskrit: 'वमन',
    category: 'Panchakarma',
    tagline: 'The Great Upward Release',
    desc: 'Performed in the Vasant (spring) season, Vamana is a guided therapeutic emesis that expels excess Kapha and accumulated toxins through the upper digestive route. Far from unpleasant, when properly prepared and supervised, it brings an extraordinary lightness — patients often describe feeling as though a weight has been lifted from their chest and lungs.',
    benefits: ['Eliminates excess Kapha', 'Clears respiratory tract', 'Treats chronic asthma', 'Skin disorder relief', 'Boosts metabolism', 'Seasonal detox'],
    icon: '',
    duration: '1–3 days (supervised)',
  },
  {
    name: 'Virechana',
    sanskrit: 'विरेचन',
    category: 'Panchakarma',
    tagline: 'The Pitta Purge',
    desc: 'Virechana uses carefully selected bitter purgatives to flush excess Pitta from its primary sites — the liver, gallbladder, and small intestine. It is the treatment of choice for inflammatory conditions, skin disorders, and liver imbalances. The result is a profound metabolic reset, with patients reporting clearer skin, sharper digestion, and reduced inflammation within days.',
    benefits: ['Liver & gallbladder detox', 'Clears skin disorders', 'Reduces inflammation', 'Treats gall stones', 'Metabolic reset', 'Eliminates excess Pitta'],
    icon: '',
    duration: '1–3 days (supervised)',
  },
  {
    name: 'Basti',
    sanskrit: 'बस्ति',
    category: 'Panchakarma',
    tagline: 'Half of All Medicine',
    desc: 'Charaka declared Basti equal to half of all Ayurvedic treatments — and for good reason. Medicated enemas deliver herbal decoctions and oils directly to the colon, the primary seat of Vata. By nourishing and cleansing the large intestine, Basti restores the body\'s ability to absorb nutrients, eliminate waste, and regulate the nervous system from its very foundation.',
    benefits: ['Eliminates Vata disorders', 'Colon cleansing', 'Relieves chronic pain', 'Restores immunity', 'Treats neurological issues', 'Rejuvenates tissues'],
    icon: '',
    duration: '7–30 days (course)',
  },
  {
    name: 'Nasya',
    sanskrit: 'नस्य',
    category: 'Head & Neck',
    tagline: 'The Gateway to the Head',
    desc: 'Ayurveda teaches that the nose is the doorway to the brain. Nasya involves instilling warm medicated oils, ghee, or herbal powders into the nasal passages to cleanse the sinuses, balance the doshas of the head, and nourish the sense organs. Two forms are practiced: Marsha Nasya for therapeutic conditions, and Pratimarsha Nasya as a daily wellness ritual.',
    benefits: ['Chronic sinusitis', 'Prevents hair fall & greying', 'Improves vision & hearing', 'Relieves headaches', 'Facial paralysis support', 'Cervical spondylosis'],
    icon: '',
    duration: '15–20 min',
  },
  {
    name: 'Raktamokshana',
    sanskrit: 'रक्तमोक्षण',
    category: 'Panchakarma',
    tagline: 'The Blood Purifier',
    desc: 'The most targeted of the five Panchakarma procedures, Raktamokshana involves the controlled removal of small quantities of impure blood to neutralise deep-seated Pitta toxins. It provides rapid, sometimes dramatic relief in acute inflammatory conditions — skin diseases, gout, hypertension — where other therapies would take weeks to act.',
    benefits: ['Purifies blood', 'Treats skin disorders', 'Relieves gout', 'Reduces hypertension', 'Liver & spleen disorders', 'Immediate Pitta relief'],
    icon: '',
    duration: '30–45 min',
  },

  // ── BASTI THERAPIES ──
  {
    name: 'Kati Basti',
    sanskrit: 'कटि बस्ति',
    category: 'Basti Therapies',
    tagline: 'The Lower Back Sanctuary',
    desc: 'A dam of black gram dough is built around the lumbar region, filled with warm medicated oil that soaks deep into the muscles, ligaments, and vertebrae of the lower back. The combination of heat and oil simultaneously reduces inflammation, dissolves stiffness, and nourishes the intervertebral discs — offering lasting relief where painkillers only mask.',
    benefits: ['Lumbar spondylosis', 'Disc prolapse relief', 'Sciatica treatment', 'Strengthens spine', 'Reduces back stiffness', 'Sacro-iliac disorders'],
    icon: '',
    duration: '30–60 min',
  },
  {
    name: 'Greeva Basti',
    sanskrit: 'ग्रीवा बस्ति',
    category: 'Basti Therapies',
    tagline: 'The Neck Liberator',
    desc: 'In an age of screens and sedentary work, the neck bears an invisible burden. Greeva Basti creates a warm oil reservoir directly over the cervical spine, allowing medicated oils to penetrate the muscles, tendons, and nerve roots of the neck. It addresses the root cause of neck pain rather than suppressing it — restoring mobility, reducing nerve compression, and relieving the tension that radiates into the shoulders and head.',
    benefits: ['Chronic neck pain', 'Cervical spondylosis', 'Frozen shoulder', 'Strengthens spine', 'Nerve decompression', 'Stress & congestion relief'],
    icon: '',
    duration: '30–45 min',
  },
  {
    name: 'Janu Basti',
    sanskrit: 'जानु बस्ति',
    category: 'Basti Therapies',
    tagline: 'The Knee Rejuvenator',
    desc: 'The knee is one of the most complex and load-bearing joints in the body, and one of the first to show the effects of age, injury, or inflammation. Janu Basti bathes the knee joint in warm medicated oil, penetrating cartilage, synovial membranes, and surrounding muscles to reduce degeneration, restore lubrication, and rebuild strength from within.',
    benefits: ['Knee pain & stiffness', 'Osteoarthritis support', 'Boosts knee circulation', 'Enhances mobility', 'Reduces inflammation', 'Strengthens joint muscles'],
    icon: '',
    duration: '30–45 min',
  },
  {
    name: 'Shiro Basti',
    sanskrit: 'शिरो बस्ति',
    category: 'Head & Neck',
    tagline: 'The Crown Oil Ritual',
    desc: 'A tall leather cap is fitted on the head and filled with warm medicated oil, which is retained for a prescribed duration based on the patient\'s dosha — 50 minutes for Vata, 40 for Pitta, 30 for Kapha. The oil penetrates the scalp, skull, and brain tissue, stimulating the limbic system, triggering the release of serotonin and endorphins, and addressing neurological and psychological conditions at their source.',
    benefits: ['PTSD & OCD support', 'Promotes deep sleep', 'Reduces anxiety & depression', 'Nourishes hair roots', 'Balances Vata in brain', 'Relieves sinusitis'],
    icon: '',
    duration: '30–50 min (dosha-based)',
  },
  {
    name: 'Uro Basti',
    sanskrit: 'उरो बस्ति',
    category: 'Basti Therapies',
    tagline: 'The Heart & Chest Healer',
    desc: 'Uro Basti focuses warm medicated oil over the chest and heart region — the seat of Prana and emotional wellbeing in Ayurveda. It is particularly indicated for cardiac conditions, respiratory disorders, and the emotional heaviness that manifests as tightness in the chest. The therapy nourishes the heart muscle, opens the lungs, and releases deeply held emotional tension.',
    benefits: ['Cardiac support', 'Respiratory disorders', 'Emotional tension release', 'Chest pain relief', 'Strengthens heart muscle', 'Opens lung channels'],
    icon: '',
    duration: '30–45 min',
  },

  // ── HEAD & NECK ──
  {
    name: 'Shiro Taila Dhara',
    sanskrit: 'शिरो तैल धारा',
    category: 'Head & Neck',
    tagline: 'The Scalp Oil Stream',
    desc: 'Similar to Shirodhara but using specific medicated oils chosen for scalp and hair conditions, Shiro Taila Dhara delivers a continuous stream of nourishing oil across the entire scalp. It deeply conditions hair follicles, reverses premature greying, arrests hair fall, and creates a profound meditative calm that is difficult to achieve through any other means.',
    benefits: ['Arrests hair fall', 'Reverses premature greying', 'Nourishes hair follicles', 'Deep scalp conditioning', 'Calms the mind', 'Improves sleep quality'],
    icon: '',
    duration: '45–60 min',
  },
  {
    name: 'Nasya Dhoompana',
    sanskrit: 'नस्य धूमपान',
    category: 'Head & Neck',
    tagline: 'The Medicated Smoke Therapy',
    desc: 'Dhoompana is the inhalation of medicated smoke prepared from specific Ayurvedic herbs. Administered after Nasya oil therapy, it completes the cleansing of the nasal passages, sinuses, and upper respiratory tract. The herbal smoke carries therapeutic compounds directly to the mucous membranes, clearing congestion, killing pathogens, and restoring the natural intelligence of the respiratory system.',
    benefits: ['Clears nasal congestion', 'Treats chronic sinusitis', 'Upper respiratory cleanse', 'Kills nasal pathogens', 'Complements Nasya therapy', 'Relieves headaches'],
    icon: '',
    duration: '10–15 min',
  },
  {
    name: 'Karan Purana',
    sanskrit: 'कर्ण पूरण',
    category: 'Head & Neck',
    tagline: 'The Ear Oil Ritual',
    desc: 'Karan Purana involves gently filling the ear canal with warm medicated ghee or oil — a practice that addresses the full spectrum of ear disorders from the inside out. Different oils are prescribed for different conditions: Bilva oil for tinnitus, Nirgundi oil for congestion and infections, Kshara Tail for discharge and otitis. Beyond the ears, this therapy relieves jaw pain, neck tension, migraines, and Vata-related neurological disorders.',
    benefits: ['Tinnitus relief', 'Hearing loss support', 'Ear infection treatment', 'Swimmer\'s ear', 'Meniere\'s disease', 'Migraine & jaw pain'],
    icon: '',
    duration: '15–20 min',
  },

  // ── MODERN & REGENERATIVE ──
  {
    name: 'Regeneration Medicine',
    sanskrit: 'Punarnava Chikitsa',
    category: 'Modern & Regenerative',
    tagline: 'Ancient Wisdom, Modern Science',
    desc: 'Ayurveda has always been a science of regeneration — Rasayana (rejuvenation therapy) is one of its eight classical branches. At Ayurshala, we bridge this ancient wisdom with modern regenerative medicine, combining Panchakarma detoxification with targeted herbal Rasayanas, mineral preparations, and lifestyle protocols to rebuild tissues, restore vitality, and slow the biological clock.',
    benefits: ['Tissue regeneration', 'Anti-aging protocols', 'Chronic disease management', 'Immunity rebuilding', 'Vitality restoration', 'Holistic rejuvenation'],
    icon: '',
    duration: 'Personalised course',
  },
  {
    name: 'Anuvasana Basti',
    sanskrit: 'अनुवासन बस्ति',
    category: 'Basti Therapies',
    tagline: 'The Nourishing Enema',
    desc: 'Unlike Niruha Basti which cleanses, Anuvasana Basti nourishes. Warm medicated oils are administered as an enema and retained in the colon for an extended period, deeply lubricating the intestinal walls, nourishing the nervous system, and rebuilding tissues depleted by chronic illness, stress, or aging. It is the gentlest and most restorative of all Basti therapies.',
    benefits: ['Deep tissue nourishment', 'Vata pacification', 'Intestinal lubrication', 'Nervous system support', 'Post-illness recovery', 'Chronic constipation'],
    icon: '',
    duration: '30–45 min',
  },
]

function TreatmentCard({ t, i }: { t: typeof treatments[0]; i: number }) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card group flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {t.icon && <span className="text-2xl flex-shrink-0 mt-0.5">{t.icon}</span>}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg text-stone-800 group-hover:text-brand transition-colors">{t.name}</h3>
            <span className="text-xs font-sans text-brand/40 bg-brand/5 border border-brand/15 rounded-full px-2 py-0.5 flex-shrink-0">{t.category}</span>
          </div>
          <p className="font-serif italic text-stone-400 text-xs">{t.sanskrit}</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="font-sans text-xs tracking-wider text-brand/60 uppercase mb-2">{t.tagline}</p>

      {/* Description */}
      <p className="font-sans text-stone-500 text-sm leading-relaxed mb-4 flex-1">
        {expanded ? t.desc : t.desc.slice(0, 120) + '…'}
      </p>

      {/* Benefits */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <p className="font-sans text-xs text-stone-400 uppercase tracking-wider mb-2">Benefits</p>
            <ul className="flex flex-wrap gap-1.5">
              {t.benefits.map(b => (
                <li key={b} className="text-xs font-sans text-brand/70 bg-brand/5 border border-brand/20 rounded-full px-2.5 py-1">{b}</li>
              ))}
            </ul>
            {t.duration && (
              <p className="font-sans text-xs text-stone-400 mt-3">
                <span className="text-stone-500">Duration:</span> {t.duration}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-sans text-xs text-brand/50 hover:text-brand transition-colors"
        >
          {expanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
        <a
          href="/book"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs text-stone-400 hover:text-brand transition-colors"
        >
          Book →
        </a>
      </div>
    </motion.div>
  )
}

export default function Treatments() {
  const [activeCategory, setActiveCategory] = useState('All')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const filtered = activeCategory === 'All'
    ? treatments
    : treatments.filter(t => t.category === activeCategory)

  return (
    <section id="treatments" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 sm:w-96 md:w-[600px] h-64 sm:h-96 md:h-[600px] rounded-full opacity-10 pointer-events-none hidden sm:block"
        style={{ background: 'radial-gradient(circle, #4a7c59 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-10 px-2"
        >
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-brand/60 mb-3"></p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight mb-4" style={{ color: '#1a1008' }}>Treatments We Offer</h2>
          <p className="font-sans text-xs sm:text-sm text-stone-500 max-w-2xl mx-auto leading-relaxed">
            Every therapy is performed as prescribed by classical Ayurvedic texts — in authentic sequence, by trained practitioners under senior consultant supervision.
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10 px-2"
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-sans text-xs tracking-wider rounded-full px-3 sm:px-5 py-2 transition-all duration-300 border whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-brand/15 border-brand/50 text-brand'
                  : 'glass border-stone-200 text-stone-400 hover:text-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 px-2">
          {filtered.map((t, i) => <TreatmentCard key={t.name} t={t} i={i} />)}
        </div>
      </div>
    </section>
  )
}
