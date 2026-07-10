/**
 * Test Notification API
 * Sends a test email to verify notification system configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTestNotification } from '@/lib/inventory/notification.service'

export async function POST(request: NextRequest) {
  try {
    console.log('========== POST /api/inventory/settings/notifications/test START ==========')

    const body = await request.json()
    const adminName = body.adminName || 'Admin'

    console.log('Sending test notification to:', adminName)

    const result = await sendTestNotification(adminName)

    console.log('========== POST /api/inventory/settings/notifications/test END (SUCCESS) ==========')

    return NextResponse.json({
      success: result,
      message: result ? 'Test email sent successfully' : 'Failed to send test email',
    })
  } catch (error: any) {
    console.error('========== POST /api/inventory/settings/notifications/test ERROR ==========')
    console.error('Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send test notification',
        details: {
          type: error?.constructor?.name,
          originalMessage: error?.message,
        },
      },
      { status: 500 }
    )
  }
}
