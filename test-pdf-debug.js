#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

// Complex test data to trigger multiple pages
const testData = {
  patient_uhid: 'TEST-001',
  patient_name: 'Test Patient',
  age: '45',
  sex: 'M',
  nationality: 'Indian',
  diagnosis: 'This is a long diagnosis that spans multiple lines to test text wrapping and layout calculations. The patient presents with chronic pain and stiffness in the joints, which has been aggravated over the past few months. The diagnosis includes multiple conditions that require careful management and follow-up care. This text should wrap across multiple lines in the PDF to properly test the paragraph height calculations and ensure that the cursor position is updated correctly by the parent render loop.',
  
  complaints: [
    'Chronic joint pain in knees and ankles with significant swelling',
    'Morning stiffness lasting more than 30 minutes with difficulty in movement',
    'Fatigue and general weakness affecting daily activities',
    'Sleep disturbances due to pain and discomfort at night',
    'Reduced mobility and difficulty in climbing stairs',
  ],
  
  history_present_complaints: 'Patient has been experiencing joint pain for the past 6 months. The pain started gradually and has progressively worsened. Initially, only the knees were affected, but now the condition has spread to ankles and other joints. The patient tried various treatments including conventional medicines but found limited relief. The pain is worse in the morning and improves slightly with movement. The patient also reports associated stiffness and swelling in the affected joints.',
  
  past_history_medical: 'Hypertension, Type 2 Diabetes',
  past_history_surgical: 'Appendectomy 10 years ago',
  
  medication_administered: 'The patient has been on various medications including NSAIDs, muscle relaxants, and pain relievers. Various herbal preparations have also been tried. The current treatment includes Ayurvedic medicines and therapies tailored to manage the Vata imbalance identified during the examination.',
  
  day_of_therapy: '14',
  
  pradhan_vedna: [
    'Severe joint pain bilaterally in knees and ankles',
    'Morning stiffness and restricted movement',
    'Swelling and inflammation in affected joints',
    'Associated muscle weakness and fatigue',
    'Sleep disturbances due to night pain',
  ],
  
  vitals_bp: '130/80',
  vitals_hr: '72',
  vitals_nadi: 'Regular',
  
  oe_mala: 'Constipation',
  oe_mutra: 'Normal',
  oe_jihwa: 'Coated',
  oe_shuda: 'Normal',
  oe_nidra: 'Disturbed',
  
  therapies: [
    'Abhyanga (Full body oil massage) with medicated oils',
    'Basti (Medicated enema) - Vata pacifying protocol',
    'Nasya (Nasal oil application) with therapeutic oils',
    'Pizichil (Continuous oil pouring therapy)',
    'Kizhi (Herbal paste massage) for inflammation',
  ],
  
  investigations: 'Lab reports show elevated inflammatory markers. X-ray findings show mild degenerative changes. ESR and CRP levels are moderately elevated indicating chronic inflammation. The investigations suggest chronic joint disease with inflammatory component.',
  
  findings_discharge: 'Patient shows significant improvement in joint pain and mobility after the treatment course. Swelling has reduced considerably. Morning stiffness duration has decreased from 45 minutes to about 15 minutes. Patient reports better sleep and increased energy levels. Overall functional status has improved significantly.',
  
  condition_discharge: 'Patient is being discharged in improved condition with pain reduced by approximately 70 percent. Mobility has improved significantly and the patient can now perform daily activities with minimal assistance. The inflammatory markers show improvement. The patient is advised to continue with the prescribed medication and lifestyle modifications.',
  
  advice_discharge: 'Continue with prescribed Ayurvedic medications as per schedule. Perform regular light exercises and yoga asanas suitable for joint health. Maintain proper sleep schedule of at least 8 hours daily. Avoid strenuous activities and heavy lifting for at least one month. Follow up with the doctor after one month for reassessment and further management.',
  
  medicines: [
    { name: 'Ashwagandha Churna', dosage: '5g', instructions: 'Mix with warm milk', schedule: 'Twice daily', duration: '3 months' },
    { name: 'Guggulu Tincture (Shallaki Guggulu)', dosage: '500mg', instructions: 'Take with water', schedule: 'Twice daily', duration: '3 months' },
    { name: 'Turmeric Curcumin Extract', dosage: '1g', instructions: 'Take with food', schedule: 'Once daily', duration: '2 months' },
    { name: 'Boswellia Serrata (Shallaki) Extract', dosage: '500mg', instructions: 'Take with warm water', schedule: 'Twice daily', duration: '3 months' },
    { name: 'Ginger Extract Supplement', dosage: '500mg', instructions: 'Take with meals', schedule: 'Once daily', duration: '2 months' },
    { name: 'Joint Care Oil (Mahanarayan Taila)', dosage: 'For massage', instructions: 'Apply externally', schedule: 'Daily before bed', duration: 'Ongoing' },
    { name: 'Brahmi Ghrita', dosage: '1 teaspoon', instructions: 'Mix with warm milk', schedule: 'Once daily', duration: '2 months' },
    { name: 'Sesame Seed Oil (Til Taila)', dosage: 'For massage', instructions: 'Apply warm to joints', schedule: 'Daily', duration: 'Ongoing' },
    { name: 'Shatavari Powder', dosage: '5g', instructions: 'Mix with water or milk', schedule: 'Once daily', duration: '2 months' },
    { name: 'Methi Seeds Powder', dosage: '5g', instructions: 'Mix in warm water', schedule: 'Once daily morning', duration: '3 months' },
  ],
  
  cautions: 'Avoid cold water and cold foods. Do not expose to sudden temperature changes. Avoid staying awake late at night. Reduce stress through meditation and relaxation techniques. Avoid prolonged sitting or standing in one position. Maintain proper hydration by drinking warm water throughout the day.',
  
  pathya: 'Warm and easily digestible foods, ghee and sesame oil, cooked vegetables like carrots and asparagus, fresh fruits like apples and grapes, whole grains and legumes in moderate amounts, warm milk with turmeric, herbal teas and warm soups.',
  
  apathya: 'Cold water and cold foods, raw and dry foods, excessive meat and non-vegetarian items, refined sugar and processed foods, alcohol and smoking, excessively spicy foods, caffeine and carbonated drinks, strenuous exercise and heavy physical work.',
  
  doctor_name: 'Sharma',
};

console.log('Generating PDF with complex test data...\n');

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/discharge-summary-pdf',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    const filename = '/tmp/test-discharge-summary.pdf';
    const file = fs.createWriteStream(filename);
    res.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`\n✓ PDF saved to: ${filename}`);
      console.log(`\nIMPORTANT: Check the Node.js console output for debug logs`);
      console.log(`Look for patterns like:`);
      console.log(`  [DEBUG] BlockName`);
      console.log(`  estimate: XX`);
      console.log(`  actual: YY`);
      console.log(`  before: ZZ`);
      console.log(`  after: WW`);
    });
  } else {
    console.error(`Error: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.error(data));
  }
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

console.log('Request sent to http://localhost:3000/api/admin/discharge-summary-pdf');
