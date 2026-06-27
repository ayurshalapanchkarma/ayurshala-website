import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface CreateTemplateInput {
  templateName: string
  channel: string
  subject?: string
  messageBody: string
  variables?: string
}

export class CommunicationService {
  /**
   * Create template
   */
  static async createTemplate(input: CreateTemplateInput, userId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.templateName?.trim()) errors.push({ field: 'templateName', message: 'Template name required' })
    if (!input.channel) errors.push({ field: 'channel', message: 'Channel required' })
    if (!input.messageBody?.trim()) errors.push({ field: 'messageBody', message: 'Message body required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('communication_templates')
      .insert({
        template_name: input.templateName,
        channel: input.channel,
        subject: input.subject || null,
        message_body: input.messageBody,
        variables: input.variables || null,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create template: ${error.message}`)
    return data
  }

  /**
   * Get active templates
   */
  static async getActiveTemplates(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('communication_templates')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('template_name', { ascending: true })

    return data || []
  }

  /**
   * Get templates by channel
   */
  static async getTemplatesByChannel(channel: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('communication_templates')
      .select('*')
      .eq('channel', channel)
      .eq('is_active', true)
      .eq('is_deleted', false)

    return data || []
  }

  /**
   * Get template
   */
  static async getTemplate(templateId: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('communication_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    return data
  }

  /**
   * Update template
   */
  static async updateTemplate(templateId: string, input: Partial<CreateTemplateInput>): Promise<any> {
    const updateData: any = {}

    if (input.templateName) updateData.template_name = input.templateName
    if (input.subject !== undefined) updateData.subject = input.subject
    if (input.messageBody) updateData.message_body = input.messageBody
    if (input.variables !== undefined) updateData.variables = input.variables
    updateData.version = supabaseAdmin.rpc('increment_version', { template_id: templateId })

    const { data, error } = await supabaseAdmin
      .from('communication_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update template: ${error.message}`)
    return data
  }

  /**
   * Get communication statistics
   */
  static async getCommunicationStats(fromDate: string, toDate: string): Promise<any> {
    const { data: logs } = await supabaseAdmin
      .from('communication_logs')
      .select('channel, status')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)

    const stats: Record<string, any> = {}

    for (const log of logs || []) {
      if (!stats[log.channel]) {
        stats[log.channel] = { total: 0, sent: 0, failed: 0, pending: 0 }
      }
      stats[log.channel].total += 1
      stats[log.channel][log.status.toLowerCase()] = (stats[log.channel][log.status.toLowerCase()] || 0) + 1
    }

    return stats
  }
}
