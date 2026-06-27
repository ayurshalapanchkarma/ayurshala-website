import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyticsService } from './analytics.service'

export interface AIContext {
  userId: string
  userRole: string
  assistantType: string
  patientId?: string
}

export interface AIResponse {
  content: string
  tokensUsed: number
  erpDataAccessed: string[]
  suggestions?: string[]
  actionable?: boolean
}

export class AIService {
  private static modelProvider = process.env.AI_MODEL_PROVIDER || 'openai'

  /**
   * Start conversation
   */
  static async startConversation(context: AIContext): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('ai_conversations')
      .insert({
        user_id: context.userId,
        user_role: context.userRole,
        assistant_type: context.assistantType,
        title: `${context.assistantType} - ${new Date().toISOString()}`,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to start conversation: ${error.message}`)
    return data
  }

  /**
   * Send message to AI (reads ERP data via Analytics APIs)
   */
  static async chat(conversationId: string, userMessage: string, context: AIContext): Promise<AIResponse> {
    // Log user message
    const { data: msgRecord } = await supabaseAdmin
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      })
      .select()
      .single()

    // Build context from ERP via Analytics
    const erpContext = await this.buildERPContext(context)

    // Get AI response (mock for now, real implementation calls LLM)
    const aiResponse = await this.getAIResponse(userMessage, erpContext, context)

    // Log AI message
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse.content,
      model_used: this.modelProvider,
      tokens_used: aiResponse.tokensUsed,
      erp_data_accessed: aiResponse.erpDataAccessed.join(','),
    })

    // Log to audit
    await this.auditAIAction(context.userId, userMessage, aiResponse)

    return aiResponse
  }

  /**
   * Build context from ERP Analytics (read-only)
   */
  private static async buildERPContext(context: AIContext): Promise<any> {
    const erpData: any = {
      userRole: context.userRole,
      dataAccessed: [],
    }

    try {
      if (context.userRole === 'RECEPTION') {
        // Reception can see: appointments, outstanding, packages
        const dashboard = await AnalyticsService.getExecutiveDashboard()
        erpData.dashboard = dashboard
        erpData.dataAccessed.push('executive_dashboard')
      } else if (context.userRole === 'DOCTOR') {
        // Doctor can see: their own data
        const dashboard = await AnalyticsService.getDoctorDashboard(context.userId)
        erpData.doctorMetrics = dashboard
        erpData.dataAccessed.push('doctor_dashboard')
      } else if (context.userRole === 'PHARMACIST') {
        // Pharmacist can see: inventory
        const inventory = await AnalyticsService.getInventoryAnalytics()
        erpData.inventory = inventory
        erpData.dataAccessed.push('inventory_analytics')
      } else if (context.userRole === 'FINANCE') {
        // Finance can see: revenue, collections
        const finance = await AnalyticsService.getFinanceAnalytics(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
        )
        erpData.finance = finance
        erpData.dataAccessed.push('finance_analytics')
      }
    } catch (error) {
      console.error('Error building ERP context:', error)
    }

    return erpData
  }

  /**
   * Get AI response (provider-agnostic)
   */
  private static async getAIResponse(
    userMessage: string,
    erpContext: any,
    context: AIContext,
  ): Promise<AIResponse> {
    // In production, this would call the configured LLM provider
    // For now, return a mock response

    const mockResponses: Record<string, string> = {
      RECEPTION:
        'I can help you check appointments, outstanding balances, and book new appointments. What would you like to know?',
      DOCTOR: 'I can summarize patient history and suggest draft notes. Always review before saving.',
      PHARMACIST: 'I can help with inventory management, stock levels, and expiry alerts.',
      FINANCE: 'I can provide revenue summaries, outstanding balance reports, and cash flow analysis.',
    }

    return {
      content: mockResponses[context.userRole] || 'How can I assist you?',
      tokensUsed: Math.floor(userMessage.length / 4) + 100,
      erpDataAccessed: erpContext.dataAccessed,
    }
  }

  /**
   * Create automation workflow
   */
  static async createWorkflow(workflowName: string, triggerEvent: string, actions: any[], userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('automation_workflows')
      .insert({
        workflow_name: workflowName,
        trigger_event: triggerEvent,
        actions: JSON.stringify(actions),
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create workflow: ${error.message}`)
    return data
  }

  /**
   * Execute automation (calls ERP Services, never direct DB writes)
   */
  static async executeAutomation(workflowId: string, triggerData: any): Promise<any> {
    const { data: workflow } = await supabaseAdmin
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (!workflow) throw new Error('Workflow not found')

    const executedActions: string[] = []

    // Parse actions and execute via ERP Services
    const actions = JSON.parse(workflow.actions)
    for (const action of actions) {
      // Example: action.type = 'SEND_NOTIFICATION', action.params = {...}
      // Always call existing ERP Services, never write directly
      executedActions.push(`${action.type}:pending`)
    }

    // Log execution
    await supabaseAdmin.from('automation_history').insert({
      workflow_id: workflowId,
      trigger_data: triggerData,
      executed_actions: executedActions.join(','),
      status: 'COMPLETED',
      completed_at: new Date(),
    })

    return { workflowId, executedActions }
  }

  /**
   * Get knowledge base
   */
  static async searchKnowledgeBase(query: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('is_approved', true)
      .or(`article_title.ilike.%${query}%,article_content.ilike.%${query}%`)

    return data || []
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(conversationId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    return data || []
  }

  /**
   * Submit AI feedback
   */
  static async submitFeedback(messageId: string, rating: string, userId: string, comments?: string): Promise<void> {
    await supabaseAdmin.from('ai_feedback').insert({
      message_id: messageId,
      rating,
      comments: comments || null,
      user_id: userId,
    })
  }

  /**
   * Audit AI action
   */
  private static async auditAIAction(userId: string, prompt: string, response: AIResponse): Promise<void> {
    await supabaseAdmin.from('ai_audit_logs').insert({
      user_id: userId,
      action: 'AI_CHAT',
      model: this.modelProvider,
      prompt: prompt.substring(0, 500),
      erp_data_accessed: response.erpDataAccessed.join(','),
      response: response.content.substring(0, 500),
    })
  }

  /**
   * Get AI usage stats
   */
  static async getUsageStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data } = await supabaseAdmin
      .from('ai_usage')
      .select('assistant_type, tokens_consumed, cost')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    const stats = {
      totalTokens: data?.reduce((sum: number, d: any) => sum + (d.tokens_consumed || 0), 0) || 0,
      totalCost: data?.reduce((sum: number, d: any) => sum + (d.cost || 0), 0) || 0,
      byAssistant: {} as Record<string, any>,
    }

    for (const d of data || []) {
      if (!stats.byAssistant[d.assistant_type]) {
        stats.byAssistant[d.assistant_type] = { tokens: 0, cost: 0 }
      }
      stats.byAssistant[d.assistant_type].tokens += d.tokens_consumed
      stats.byAssistant[d.assistant_type].cost += d.cost
    }

    return stats
  }
}
