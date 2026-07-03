/**
 * Create comprehensive test discharge summary for visual QA
 * This creates a record with all fields populated for realistic testing
 */

const https = require('https');

const SUPABASE_URL = 'edwzyrdikttdxmphpvvp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkd3p5cmRpa3R0ZHhtcGhwdnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzOTkyNywiZXhwIjoyMDk2MjE1OTI3fQ.v2mlKmY4q27M0ymTcIP-WAYy8F8QXhOuh4ulOwlNJUM';

const testSummary = {
  booking_id: '550e8400-e29b-41d4-a716-446655440000', // Use a known UUID
  patient_uhid: 'AYP-2026-QA-VISUAL',
  patient_name: 'Priya Sharma',
  age: '52',
  sex: 'F',
  nationality: 'Indian',
  address: '456 Park Avenue, New Delhi, Delhi 110016, India',
  
  doa_date: '2026-06-10',
  doa_time: '09:00',
  dod_date: '2026-07-02',
  dod_time: '16:30',
  
  diagnosis: 'Chronic Migraine with Cervical Spondylosis and Vata-Pitta Imbalance. Patient presents with recurrent tension headaches radiating from occipital region, associated with cervical stiffness and photosensitivity. Imaging confirms Grade 2 degenerative disc disease at C5-C6 levels.',
  
  complaints: [
    'Recurrent severe headaches (3-4 times per week)',
    'Neck stiffness and limited cervical mobility',
    'Photophobia and sound sensitivity',
    'Sleep disturbance due to pain',
    'Shoulder and upper back tension radiating to arms',
    'Occasional vertigo and dizziness',
  ],
  
  history_present_complaints: 'The patient is a 52-year-old female with a 7-year history of chronic migraine headaches that have progressively worsened over the past 18 months. Headaches typically occur 3-4 times per week, lasting 4-8 hours each. Patient reports characteristic prodromal symptoms including visual auras, phonophobia, and photophobia. Associated with significant neck stiffness, particularly in the mornings, and bilateral shoulder tension. Recent MRI revealed degenerative changes at C5-C6 with mild neural foraminal narrowing. Previous management with prophylactic medications (beta-blockers, tricyclic antidepressants) provided only modest relief. Patient reports stress-related exacerbation and weather-dependent pattern. Sleep quality significantly impacted by nighttime pain and inability to maintain comfortable head position. Functional limitation noted in daily activities, especially reading and computer work.',
  
  history_days: '7 years (recent exacerbation: 18 months)',
  
  past_history_medical: 'Hypertension (controlled on amlodipine 5mg daily). Mild dyslipidemia. No diabetes, thyroid disorders, or psychiatric conditions.',
  past_history_surgical: 'Appendectomy at age 28. No spinal or neurological surgeries.',
  past_history_details: 'Patient is an HR consultant working primarily from office. High-stress occupation with long hours at computer. Sedentary lifestyle with minimal regular exercise. Diet includes regular tea and coffee consumption (3-4 cups daily). Sleep pattern irregular—typically 5-6 hours nightly with frequent interruptions. Recent lifestyle changes include increased screen time and poor postural habits.',
  
  medication_administered: 'Internal: Ashwagandha (600mg twice daily), Brahmi (300mg twice daily), Jatamansi (200mg once daily at night). External: Mahanarayan Oil massage daily, Nasya with Brahmi Oil alternate days. Shiro Dhara with Brahmi-Jatamansi Taila for 45 minutes daily. Herbal tea: Ginger-Turmeric infusion twice daily.',
  
  day_of_therapy: '22 days of intensive in-house Panchakarma and Neurological Management Protocol',
  
  pradhan_vedna: [
    'Occipital and frontal region headaches with migraine characteristics',
    'Cervical region stiffness and myofascial tension',
    'Vata-predominant symptoms: irregular sleep, dry skin, anxiety',
    'Pitta-predominant symptoms: irritability, photophobia, heat sensitivity',
  ],
  
  vitals_bp: '138/84 mmHg',
  vitals_hr: '76 bpm',
  vitals_nadi: 'Vata-Pitta pulse, slightly irregular (70-80 rpm)',
  
  oe_mala: 'Samyak (normal, regular)',
  oe_mutra: 'Samyak (clear, adequate)',
  oe_jihwa: 'Slight white coating, normal',
  oe_shuda: 'Normal, no perspiration',
  oe_nidra: 'Improved from 4-5 hours to 6-7 hours per night',
  
  therapies: [
    'Abhyanga (synchronized oil massage) — daily, 45 minutes',
    'Shiro Dhara (continuous warm oil flow to forehead) — daily, 45 minutes',
    'Nasya (nasal oil therapy) — alternate days',
    'Pinda Sweda (herbal poultice fomentation) — 4 times per week',
    'Basti (medicated enema) — 2 times per week',
    'Shirobasti (oil retention on head) — once weekly',
  ],
  
  investigations: 'MRI Cervical Spine (pre-treatment): Grade 2 degenerative disc disease at C5-C6 with mild neural foraminal narrowing, no cord compression. Blood pressure monitoring: baseline 142/88, discharge 138/84 mmHg. Sleep quality assessment: significant improvement in sleep architecture and duration.',
  
  findings_discharge: 'Patient shows marked clinical improvement across all parameters. Headache frequency reduced from 3-4 episodes per week to 1 episode per week. Severity decreased from 8-9/10 to 4/10 on pain scale. Cervical range of motion improved significantly—can now turn head 80 degrees bilaterally (baseline 45 degrees). Photophobia and phonophobia markedly reduced. Sleep duration improved to 7-8 hours nightly with fewer interruptions. Patient reports improved mood, reduced anxiety, and better stress tolerance. Neck tension resolved by approximately 70%. Upper back and shoulder tension minimized.',
  
  condition_discharge: 'Patient discharged in significantly improved condition. Acute exacerbation of chronic migraine well-controlled. Cervical musculoskeletal complaints substantially resolved. Vata-Pitta imbalance corrected through intensive Panchakarma protocol. Patient counseled regarding lifestyle modifications for long-term management.',
  
  advice_discharge: 'Continue prescribed oral medications without interruption for minimum 3 months to consolidate therapeutic gains. Maintain consistent daily Abhyanga routine using warm sesame or brahmi-infused oils—focus on neck, shoulders, and scalp regions. Practice gentle neck mobility exercises daily—avoid sudden movements and jerking motions. Implement strict ergonomic modifications at workplace: adjust monitor at eye level, take frequent screen breaks every 30 minutes, maintain proper posture while sitting. Avoid prolonged computer use beyond 2-3 hours without breaks. Establish regular sleep schedule with consistent bedtime of 10 PM and wake time of 6 AM; maintain cool, dark sleeping environment; use supportive cervical pillow. Gradual increase in physical activity starting with 20-minute walks daily; progress to gentle yoga (avoid inverted poses initially). Stress management through daily meditation (minimum 15 minutes) and pranayama practices. Dietary adjustments: increase warm, cooked meals; reduce cold foods and drinks; avoid caffeine after 2 PM; include turmeric and ginger in daily diet. Climate control: maintain warm environment during winter months; avoid exposure to cold air and air conditioning. Follow-up appointments: initial review after 2 weeks, then monthly for 3 months to monitor progress and make adjustments.',
  
  medicine_discharge: 'Ashwagandha (Withania somnifera) 600mg tablets twice daily with warm milk. Brahmi (Bacopa monnieri) 300mg tablets twice daily with meals. Jatamansi (Nardostachys jatamansi) 200mg tablets once daily at bedtime. Nasya oil (Brahmi-based) 5 drops in each nostril every alternate morning on empty stomach. Shiro Taila (specialized herbal oil for head massage) for daily massage. Brahmi Ghrita 5ml once daily on empty stomach in morning.',
  
  medicines: [
    {
      name: 'Ashwagandha (Withania somnifera) tablets',
      dosage: '600mg',
      instructions: 'Twice daily with warm milk and 1 teaspoon ghee',
      schedule: 'Morning (7 AM) and Evening (8 PM)',
      duration: '90 days',
    },
    {
      name: 'Brahmi (Bacopa monnieri) tablets',
      dosage: '300mg',
      instructions: 'With warm water after meals',
      schedule: 'After breakfast (8:30 AM) and dinner (7:30 PM)',
      duration: '90 days',
    },
    {
      name: 'Jatamansi (Nardostachys jatamansi) tablets',
      dosage: '200mg',
      instructions: 'With warm milk and honey on empty stomach',
      schedule: 'Before bedtime (10 PM)',
      duration: '60 days',
    },
    {
      name: 'Nasya Oil (Brahmi & Jatamansi infused)',
      dosage: '5 drops per nostril',
      instructions: 'Instill gently in each nostril, sniff deeply, lie back for 2 minutes',
      schedule: 'Every alternate morning on empty stomach',
      duration: '60 days',
    },
    {
      name: 'Shiro Taila (Head Massage Oil)',
      dosage: '20-30ml per application',
      instructions: 'Warm gently, apply to scalp and neck, massage for 15-20 minutes',
      schedule: 'Daily in evening before bath',
      duration: 'Continue indefinitely',
    },
    {
      name: 'Brahmi Ghrita',
      dosage: '5ml',
      instructions: 'On empty stomach with warm milk',
      schedule: 'Once daily in early morning (6:30 AM)',
      duration: '60 days',
    },
    {
      name: 'Ginger-Turmeric tea',
      dosage: '1-2 cups',
      instructions: 'Boil fresh ginger (1 inch), turmeric powder (1/4 tsp), add honey and lemon',
      schedule: 'Twice daily—morning and evening',
      duration: 'Daily routine',
    },
    {
      name: 'Ashwagandha-Brahmi decoction',
      dosage: '30ml',
      instructions: 'Freshly prepared decoction, consume warm',
      schedule: 'Once daily in afternoon (3 PM)',
      duration: '45 days',
    },
    {
      name: 'Brahmi powder (Churna)',
      dosage: '3g',
      instructions: 'Mix with warm water or milk',
      schedule: 'Twice daily with meals',
      duration: '30 days',
    },
    {
      name: 'Sesame seed paste (Til Paste)',
      dosage: '1-2 teaspoons',
      instructions: 'With warm milk in morning',
      schedule: 'Daily with breakfast',
      duration: 'Ongoing maintenance',
    },
  ],
  
  cautions: 'Avoid sudden head movements, jerking motions, and extreme neck flexion-extension. Do not engage in contact sports or high-impact exercise for minimum 2 weeks. Avoid stressful situations and loud noises as much as possible during recovery phase. Do not expose head and neck to cold air, air conditioning, or drafts. Avoid sudden temperature changes. Do not consume cold foods, cold water, or ice-containing beverages. Avoid heavy, fried, and oily foods; spicy food may be consumed in moderation. Do not skip meals or fast without medical consultation. Minimize screen time; take regular breaks during computer work. Do not drive for extended periods—take breaks every 45 minutes.',
  
  pathya: 'Include warm, easily digestible, and nutritious foods. Ghee, sesame oil, and coconut oil are recommended for cooking. Light broths, warm cooked vegetables (carrots, beets, leafy greens), whole grains (basmati rice, wheat), and legumes (moong dal, masoor) are beneficial. Include seeds (sesame, flax) and nuts (almonds, walnuts) daily. Warm herbal teas with ginger, turmeric, and tulsi are recommended. Milk products (warm milk, ghee, yogurt) support digestive and nervous system health. Maintain meal timing regularity for optimal digestion.',
  
  apathya: 'Strictly avoid cold foods, cold drinks, ice cream, and refrigerated items. Avoid raw salads, cold fruits (especially citrus), and fermented foods like yogurt and pickles. Avoid caffeine in excess (limit to morning only if necessary). Avoid chocolate and overly sweet foods. Avoid heavy, fried, oily, and spicy foods; reduce salt intake. Avoid processed foods, white sugar, and refined flour products. Avoid alcohol, tobacco, and recreational drugs. Avoid extremely hot foods and beverages. Avoid dried fruits and nuts in excess. Avoid engaging in stressful mental activities close to bedtime.',
  
  doctor_name: 'Dr. Farha Naqvi',
};

function createSummary() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(testSummary);

    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/discharge_summaries',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.statusCode);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    console.log('Creating comprehensive test discharge summary...\n');
    const status = await createSummary();
    
    console.log(`✓ Created successfully (${status})\n`);
    console.log('Patient: Priya Sharma (AYP-2026-QA-VISUAL)');
    console.log('Doctor: Dr. Farha Naqvi');
    console.log('Features:');
    console.log('  • Long diagnosis (2+ paragraphs)');
    console.log('  • Comprehensive history (500+ words)');
    console.log('  • 10 medicines with full details');
    console.log('  • 6 therapies');
    console.log('  • Extended advice section');
    console.log('  • Detailed pathya and apathya');
    console.log('\nPreview URL for Visual QA:');
    console.log(`http://localhost:3000/admin/pdf-preview?booking_uuid=550e8400-e29b-41d4-a716-446655440000\n`);
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
