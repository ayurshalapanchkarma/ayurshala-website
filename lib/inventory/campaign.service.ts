import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface CreateCampaignInput {
  campaignName: string
  campaignType?: string
  description?: string
  startDate: string
  endDate?: string
  targetSegment?: string
  templateId: string
}

export class CampaignService {
  /**
   * Create campaign
   */
  static async createCampaign(input: CreateCampaignInput, userId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.campaignName?.trim()) errors.push({ field: 'campaignName', message: 'Campaign name required' })
    if (!input.templateId?.trim()) errors.push({ field: 'templateId', message: 'Template required' })
    if (!input.startDate) errors.push({ field: 'startDate', message: 'Start date required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        campaign_name: input.campaignName,
        campaign_type: input.campaignType || null,
        description: input.description || null,
        start_date: input.startDate,
        end_date: input.endDate || null,
        target_segment: input.targetSegment || null,
        template_id: input.templateId,
        status: 'ACTIVE',
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create campaign: ${error.message}`)
    return data
  }

  /**
   * Get active campaigns
   */
  static async getActiveCampaigns(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('status', 'ACTIVE')
      .eq('is_deleted', false)
      .order('start_date', { ascending: false })

    return data || []
  }

  /**
   * Get campaign details
   */
  static async getCampaign(campaignId: string): Promise<any> {
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    const { data: recipients } = await supabaseAdmin
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)

    return { ...campaign, recipients: recipients || [] }
  }

  /**
   * Add campaign recipients
   */
  static async addCampaignRecipients(campaignId: string, patientIds: string[]): Promise<void> {
    const recipientData = patientIds.map((patientId) => ({
      campaign_id: campaignId,
      patient_id: patientId,
      status: 'PENDING',
    }))

    const { error } = await supabaseAdmin
      .from('campaign_recipients')
      .insert(recipientData)

    if (error) throw new Error(`Failed to add recipients: ${error.message}`)
  }

  /**
   * Get patients by segment
   */
  static async getPatientsBySegment(segment: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('patient_tags')
      .select('patient_id')
      .eq('segment', segment)

    const patientIds = [...new Set((data || []).map((t: any) => t.patient_id))]

    if (patientIds.length === 0) return []

    const { data: patients } = await supabaseAdmin
      .from('patients')
      .select('id, name, phone, email')
      .in('id', patientIds)

    return patients || []
  }

  /**
   * Get campaign performance
   */
  static async getCampaignPerformance(campaignId: string): Promise<any> {
    const { data: recipients } = await supabaseAdmin
      .from('campaign_recipients')
      .select('status')
      .eq('campaign_id', campaignId)

    const stats = {
      total: recipients?.length || 0,
      sent: recipients?.filter((r: any) => r.status === 'SENT').length || 0,
      failed: recipients?.filter((r: any) => r.status === 'FAILED').length || 0,
      pending: recipients?.filter((r: any) => r.status === 'PENDING').length || 0,
    }

    return {
      ...stats,
      successRate: stats.total ? ((stats.sent / stats.total) * 100).toFixed(2) : 0,
    }
  }
}
