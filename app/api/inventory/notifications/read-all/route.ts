import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/inventory/notifications/read-all
 * Mark all unread notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await supabaseAdmin
      .from('inv_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('is_read', false)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Mark All Read API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
