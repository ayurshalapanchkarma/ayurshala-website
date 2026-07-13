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

    console.log('========== POST /api/inventory/settings/notifications/test END ==========', { result })

    if (!result) {
      // sendTestNotification returns false when it catches an error internally
      return NextResponse.json(
        {
          success: false,
          error: 'Email could not be delivered. Check SMTP configuration and server logs for details.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    })
  } catch (error: any) {
    console.error('========== POST /api/inventory/settings/notifications/test ERROR ==========')
    console.error('Error details:', {
      message: error?.message,
      type: error?.constructor?.name,
      code: error?.code,
    })

    // Surface a descriptive error message
    let userMessage = 'Failed to send test email.'
    const msg: string = error?.message || ''
    if (msg.includes('SMTP credentials not configured')) {
      userMessage = 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in environment variables.'
    } else if (msg.includes('Invalid login') || msg.includes('535') || msg.includes('auth')) {
      userMessage = 'SMTP authentication failed. Verify SMTP_USER and SMTP_PASSWORD are correct (use an App Password for Gmail).'
    } else if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND')) {
      userMessage = `Cannot connect to SMTP server (${process.env.SMTP_HOST}:${process.env.SMTP_PORT}). Check SMTP_HOST and SMTP_PORT.`
    } else if (msg) {
      userMessage = msg
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: {
          type: error?.constructor?.name,
          code: error?.code,
          originalMessage: error?.message,
        },
      },
      { status: 500 }
    )
  }
}
