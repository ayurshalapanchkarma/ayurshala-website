import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inventory/notifications
 * Fetch all notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeRead = searchParams.get('includeRead') === 'true'

    let query = supabaseAdmin
      .from('inv_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!includeRead) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Notifications API] Error:', error)
      throw error
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('inv_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    return NextResponse.json({
      notifications: data || [],
      unreadCount: unreadCount || 0,
    })
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/notifications/read
 * Mark a single notification as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('inv_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Mark Read API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
