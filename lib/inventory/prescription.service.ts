import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export type PrescriptionStatus = 'DRAFT' | 'ACTIVE' | 'PARTIALLY_DISPENSED' | 'DISPENSED' | 'COMPLETED' | 'CANCELLED'
export type Frequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY' | 'FOUR_TIMES_DAILY' | 'ALTERNATE_DAYS' | 'EVERY_OTHER_DAY' | 'WEEKLY' | 'AS_NEEDED'
export type MedicineTiming = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD'

export interface PrescriptionMedicine {
  productId: string
  dosage: number
  dosageUnit: string
  frequency: Frequency
  durationDays: number
  quantityRequired: number
  timing?: MedicineTiming
  instructions?: string
}

export interface PrescriptionTreatment {
  treatmentName: string
  sessionsPlanned: number
  frequency: Frequency
  durationDays: number
  doctorNotes?: string
}

export interface CreatePrescriptionInput {
  patientId: string
  appointmentId?: string
  diagnosis: string
  chiefComplaint?: string
  clinicalNotes?: string
  medicines: PrescriptionMedicine[]
  treatments?: PrescriptionTreatment[]
  advice?: string
  dietInstructions?: string
  lifestyleRecommendations?: string
  followUpDate?: string
}

export class PrescriptionService {
  /**
   * Create prescription
   */
  static async createPrescription(input: CreatePrescriptionInput, doctorId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.patientId?.trim()) errors.push({ field: 'patientId', message: 'Patient required' })
    if (!input.diagnosis?.trim()) errors.push({ field: 'diagnosis', message: 'Diagnosis required' })
    if (!input.medicines || input.medicines.length === 0) {
      if (!input.treatments || input.treatments.length === 0) {
        errors.push({ field: 'items', message: 'At least one medicine or treatment required' })
      }
    }

    if (errors.length > 0) throw new ValidationException(errors)

    // Generate prescription number
    const rxNumber = await this.generatePrescriptionNumber()

    // Create prescription
    const { data: rx, error: rxError } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        prescription_number: rxNumber,
        patient_id: input.patientId,
        doctor_id: doctorId,
        appointment_id: input.appointmentId || null,
        diagnosis: input.diagnosis.trim(),
        chief_complaint: input.chiefComplaint?.trim() || null,
        clinical_notes: input.clinicalNotes?.trim() || null,
        advice: input.advice?.trim() || null,
        diet_instructions: input.dietInstructions?.trim() || null,
        lifestyle_recommendations: input.lifestyleRecommendations?.trim() || null,
        follow_up_date: input.followUpDate || null,
        status: 'DRAFT',
        created_by: doctorId,
      })
      .select()
      .single()

    if (rxError) throw new Error(`Failed to create prescription: ${rxError.message}`)
    if (!rx) throw new Error('Failed to create prescription')

    // Add medicines
    for (const med of input.medicines || []) {
      await supabaseAdmin.from('prescription_items').insert({
        prescription_id: rx.id,
        product_id: med.productId,
        dosage: med.dosage,
        dosage_unit: med.dosageUnit,
        frequency: med.frequency,
        duration_days: med.durationDays,
        quantity_required: med.quantityRequired,
        timing: med.timing || null,
        instructions: med.instructions || null,
      })
    }

    // Add treatments
    for (const tx of input.treatments || []) {
      await supabaseAdmin.from('prescription_treatments').insert({
        prescription_id: rx.id,
        treatment_name: tx.treatmentName,
        sessions_planned: tx.sessionsPlanned,
        frequency: tx.frequency,
        duration_days: tx.durationDays,
        doctor_notes: tx.doctorNotes || null,
      })
    }

    // Create follow-up if date provided
    if (input.followUpDate) {
      await supabaseAdmin.from('follow_ups').insert({
        prescription_id: rx.id,
        patient_id: input.patientId,
        doctor_id: doctorId,
        follow_up_date: input.followUpDate,
        status: 'PENDING',
      })
    }

    return this.getPrescriptionById(rx.id)
  }

  /**
   * Get prescription with all details
   */
  static async getPrescriptionById(prescriptionId: string): Promise<any> {
    const { data: rx } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single()

    const { data: medicines } = await supabaseAdmin
      .from('prescription_items')
      .select('*, inventory_products(name, sku)')
      .eq('prescription_id', prescriptionId)

    const { data: treatments } = await supabaseAdmin
      .from('prescription_treatments')
      .select('*')
      .eq('prescription_id', prescriptionId)

    const { data: followUps } = await supabaseAdmin
      .from('follow_ups')
      .select('*')
      .eq('prescription_id', prescriptionId)

    return {
      ...rx,
      medicines: medicines || [],
      treatments: treatments || [],
      followUps: followUps || [],
    }
  }

  /**
   * Get patient prescriptions
   */
  static async getPatientPrescriptions(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Activate prescription (DRAFT → ACTIVE)
   */
  static async activatePrescription(prescriptionId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('prescriptions')
      .update({ status: 'ACTIVE' })
      .eq('id', prescriptionId)
      .select()
      .single()

    if (error) throw new Error(`Failed to activate: ${error.message}`)
    return data
  }

  /**
   * Get prescriptions pending dispensing
   */
  static async getPendingDispensing(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        id, prescription_number, patient_id, status,
        prescription_items(id, product_id, quantity_required, dispensed_quantity, inventory_products(name))
      `)
      .in('status', ['ACTIVE', 'PARTIALLY_DISPENSED'])
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Update medicine dispensed quantity
   */
  static async updateDispensingQuantity(prescriptionItemId: string, dispensedQuantity: number): Promise<void> {
    const { data: item } = await supabaseAdmin
      .from('prescription_items')
      .select('quantity_required')
      .eq('id', prescriptionItemId)
      .single()

    if (!item) throw new Error('Prescription item not found')

    await supabaseAdmin
      .from('prescription_items')
      .update({ dispensed_quantity: dispensedQuantity })
      .eq('id', prescriptionItemId)

    // Update prescription status if all medicines dispensed
    const { data: items } = await supabaseAdmin
      .from('prescription_items')
      .select('quantity_required, dispensed_quantity')
      .eq('prescription_id', (await supabaseAdmin.from('prescription_items').select('prescription_id').eq('id', prescriptionItemId).single()).data?.prescription_id)

    const allDispensed = items?.every((i: any) => i.dispensed_quantity >= i.quantity_required)
    const anyDispensed = items?.some((i: any) => i.dispensed_quantity > 0)

    if (allDispensed) {
      await supabaseAdmin
        .from('prescriptions')
        .update({ status: 'DISPENSED' })
        .eq('id', (await supabaseAdmin.from('prescription_items').select('prescription_id').eq('id', prescriptionItemId).single()).data?.prescription_id)
    } else if (anyDispensed) {
      await supabaseAdmin
        .from('prescriptions')
        .update({ status: 'PARTIALLY_DISPENSED' })
        .eq('id', (await supabaseAdmin.from('prescription_items').select('prescription_id').eq('id', prescriptionItemId).single()).data?.prescription_id)
    }
  }

  private static async generatePrescriptionNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('prescriptions')
      .select('prescription_number')
      .like('prescription_number', `RX-${year}-%`)
      .order('prescription_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].prescription_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `RX-${year}-${seq}`
  }
}
