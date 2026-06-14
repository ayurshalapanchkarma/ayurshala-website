interface CertData {
  certificate_no: string
  patient: { full_name: string; patient_id: string }
  issue_date: string
  issued_by: string
  valid_from?: string
  valid_to?: string
  purpose?: string
  diagnosis?: string
  treatment_details?: string
  recommendations?: string
  restrictions?: string
  additional_notes?: string
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN')

export const certificateNarratives = {
  'SICK LEAVE CERTIFICATE': (cert: CertData) => `
This is to certify that Mr./Ms. ${cert.patient.full_name} (Patient ID: ${cert.patient.patient_id}) was examined at Ayurshala Panchakarma Center on ${formatDate(cert.issue_date)}.

Based on clinical assessment, the patient is advised complete medical rest from ${cert.valid_from ? formatDate(cert.valid_from) : 'date to be determined'} to ${cert.valid_to ? formatDate(cert.valid_to) : 'date to be determined'}.

Reason for leave: ${cert.diagnosis || 'Medical evaluation'}

The patient is advised to resume normal activities only after the completion of the recommended rest period or upon further consultation.

${cert.recommendations ? `\nRecommendations: ${cert.recommendations}` : ''}
${cert.restrictions ? `\nRestrictions: ${cert.restrictions}` : ''}
  `.trim(),

  'MEDICAL FITNESS CERTIFICATE': (cert: CertData) => `
This is to certify that Mr./Ms. ${cert.patient.full_name} (Patient ID: ${cert.patient.patient_id}) has undergone a comprehensive medical examination at Ayurshala Panchakarma Center on ${formatDate(cert.issue_date)}.

Based on the clinical assessment and medical evaluation, the patient is declared medically fit for ${cert.purpose || 'normal duties'}.

${cert.diagnosis ? `Clinical findings: ${cert.diagnosis}` : ''}
${cert.treatment_details ? `Treatment provided: ${cert.treatment_details}` : ''}
${cert.recommendations ? `\nRecommendations: ${cert.recommendations}` : ''}

This certificate is valid from ${cert.valid_from ? formatDate(cert.valid_from) : 'date of issue'} to ${cert.valid_to ? formatDate(cert.valid_to) : 'date of review'}.
  `.trim(),

  'CONSULTATION CERTIFICATE': (cert: CertData) => `
This is to certify that Mr./Ms. ${cert.patient.full_name} (Patient ID: ${cert.patient.patient_id}) attended a consultation session at Ayurshala Panchakarma Center on ${formatDate(cert.issue_date)}.

Purpose of consultation: ${cert.purpose || 'Health evaluation'}

Clinical assessment: ${cert.diagnosis || 'Medical consultation'}

${cert.treatment_details ? `Treatment recommendations: ${cert.treatment_details}` : ''}
${cert.recommendations ? `Advised actions: ${cert.recommendations}` : ''}
${cert.restrictions ? `Restrictions to follow: ${cert.restrictions}` : ''}

This certificate confirms the patient's participation in the consultation and the recommendations provided during the session.
  `.trim(),

  'PANCHAKARMA CERTIFICATE': (cert: CertData) => `
This is to certify that Mr./Ms. ${cert.patient.full_name} (Patient ID: ${cert.patient.patient_id}) has successfully completed Panchakarma treatment at Ayurshala Panchakarma Center from ${cert.valid_from ? formatDate(cert.valid_from) : 'date of commencement'} to ${cert.valid_to ? formatDate(cert.valid_to) : 'date of completion'}.

Treatment overview: ${cert.diagnosis || 'Panchakarma therapy'}

${cert.treatment_details ? `Treatment procedures: ${cert.treatment_details}` : ''}

${cert.recommendations ? `Post-treatment recommendations: ${cert.recommendations}` : ''}
${cert.restrictions ? `Lifestyle modifications advised: ${cert.restrictions}` : ''}
${cert.additional_notes ? `Additional notes: ${cert.additional_notes}` : ''}

The patient has completed the prescribed treatment protocol as per Ayurvedic principles.
  `.trim(),

  'TREATMENT CERTIFICATE': (cert: CertData) => `
This is to certify that Mr./Ms. ${cert.patient.full_name} (Patient ID: ${cert.patient.patient_id}) has undergone treatment at Ayurshala Panchakarma Center from ${cert.valid_from ? formatDate(cert.valid_from) : 'date of treatment'} to ${cert.valid_to ? formatDate(cert.valid_to) : 'date of completion'}.

Treatment type: ${cert.diagnosis || 'Therapeutic treatment'}

${cert.treatment_details ? `Details: ${cert.treatment_details}` : ''}

${cert.recommendations ? `Follow-up recommendations: ${cert.recommendations}` : ''}
${cert.restrictions ? `Restrictions: ${cert.restrictions}` : ''}

The patient has completed the prescribed treatment course as recommended.
  `.trim(),

  'DISCHARGE SUMMARY CERTIFICATE': (cert: CertData) => `
This is to certify that Mr./Ms. ${cert.patient.full_name} (Patient ID: ${cert.patient.patient_id}) has been evaluated and discharged from Ayurshala Panchakarma Center on ${formatDate(cert.issue_date)}.

Presenting condition: ${cert.diagnosis || 'Medical evaluation completed'}

${cert.treatment_details ? `Treatment provided: ${cert.treatment_details}` : ''}

${cert.recommendations ? `Discharge recommendations: ${cert.recommendations}` : ''}
${cert.restrictions ? `Activity restrictions: ${cert.restrictions}` : ''}
${cert.additional_notes ? `Additional instructions: ${cert.additional_notes}` : ''}

The patient is discharged in stable condition with the above recommendations for continued care.
  `.trim(),
}

export const getNarrativeText = (certType: string, cert: CertData): string => {
  const template = certificateNarratives[certType as keyof typeof certificateNarratives]
  if (template) {
    return template(cert)
  }
  return `Certificate for ${cert.patient.full_name} (ID: ${cert.patient.patient_id}) issued on ${formatDate(cert.issue_date)}.`
}
