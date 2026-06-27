import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

export class APIGatewayService {
  /**
   * Generate API key
   */
  static async generateAPIKey(userId: string, keyName: string, scope?: string): Promise<any> {
    const apiKey = crypto.randomBytes(32).toString('hex')
    const apiSecret = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        key_name: keyName,
        api_key: apiKey,
        api_secret: apiSecret,
        user_id: userId,
        scope: scope || 'read,write',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to generate API key: ${error.message}`)

    return { ...data, api_key: apiKey } // Return full key once
  }

  /**
   * Validate API key
   */
  static async validateAPIKey(apiKey: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (!data) return null
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null

    // Update last used
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date() })
      .eq('id', data.id)

    return data
  }

  /**
   * Create webhook
   */
  static async createWebhook(userId: string, webhookUrl: string, eventType: string): Promise<any> {
    const secretToken = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        webhook_name: `${eventType}-${Date.now()}`,
        webhook_url: webhookUrl,
        event_type: eventType,
        user_id: userId,
        secret_token: secretToken,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create webhook: ${error.message}`)
    return data
  }

  /**
   * Trigger webhook
   */
  static async triggerWebhook(webhookId: string, payload: any): Promise<void> {
    const { data: webhook } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single()

    if (!webhook) return

    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': crypto
            .createHmac('sha256', webhook.secret_token)
            .update(JSON.stringify(payload))
            .digest('hex'),
        },
        body: JSON.stringify(payload),
      })

      await supabaseAdmin.from('webhook_events').insert({
        webhook_id: webhookId,
        event_type: webhook.event_type,
        payload,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        response_code: response.status,
        attempted_at: new Date(),
      })
    } catch (error) {
      await supabaseAdmin.from('webhook_events').insert({
        webhook_id: webhookId,
        event_type: webhook.event_type,
        payload,
        status: 'FAILED',
        attempted_at: new Date(),
      })
    }
  }

  /**
   * Send notification
   */
  static async sendNotification(userId: string, notification: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: notification.type,
        title: notification.title,
        message: notification.message,
        channel: notification.channel || 'IN_APP',
        status: 'PENDING',
        data: notification.data || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to send notification: ${error.message}`)
    return data
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data || []
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date(), status: 'READ' })
      .eq('id', notificationId)
  }

  /**
   * Log API request
   */
  static async logAPIRequest(userId: string, endpoint: string, method: string, statusCode: number, responseTime: number, ipAddress?: string): Promise<void> {
    await supabaseAdmin.from('api_logs').insert({
      user_id: userId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTime,
      ip_address: ipAddress || null,
    })
  }

  /**
   * Get API key usage
   */
  static async getAPIKeyUsage(apiKeyId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: logs } = await supabaseAdmin
      .from('api_logs')
      .select('endpoint, method, status_code')
      .gte('created_at', startDate.toISOString())

    const stats = {
      totalRequests: logs?.length || 0,
      successRequests: logs?.filter((l: any) => l.status_code >= 200 && l.status_code < 300).length || 0,
      errorRequests: logs?.filter((l: any) => l.status_code >= 400).length || 0,
    }

    return stats
  }

  /**
   * Track device session
   */
  static async trackDeviceSession(userId: string, deviceInfo: any): Promise<any> {
    const { data } = await supabaseAdmin
      .from('device_sessions')
      .insert({
        user_id: userId,
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        ip_address: deviceInfo.ipAddress,
        user_agent: deviceInfo.userAgent,
      })
      .select()
      .single()

    return data
  }

  /**
   * Get user sessions
   */
  static async getUserSessions(userId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('login_at', { ascending: false })

    return data || []
  }

  /**
   * Revoke session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    await supabaseAdmin
      .from('device_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
  }
}
