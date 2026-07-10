/**
 * Inventory Notification Service
 * Handles sending notifications based on settings
 */

'use server'

import { SettingsService } from './settings.service'
import { sendEmail, EmailOptions } from './email.service'
import {
  INVENTORY_NOTIFICATION_EMAIL,
  NotificationType,
  NOTIFICATION_SETTINGS_KEYS,
  NOTIFICATION_LABELS,
  hasDisabledNotificationBeenSent,
  markDisabledNotificationAsSent,
} from './notification-config'
import {
  generateNotificationEmailHTML,
  generateDisabledNotificationEmailHTML,
  NotificationEmailData,
} from './notification-email-template'

interface NotificationLog {
  notificationType: string
  recipient: string
  status: 'SENT' | 'SKIPPED'
  reason?: string
  timestamp: string
}

const logs: NotificationLog[] = []

/**
 * Check if a notification type is enabled in settings
 */
async function isNotificationEnabled(notificationType: NotificationType): Promise<boolean> {
  try {
    const settings = await SettingsService.getGeneralSettings()
    const settingKey = NOTIFICATION_SETTINGS_KEYS[notificationType]
    return settings?.[settingKey] === true
  } catch (error) {
    console.error('Error checking notification settings:', error)
    return false
  }
}

/**
 * Log a notification event
 */
async function logNotification(log: NotificationLog): Promise<void> {
  logs.push(log)
  console.log(
    `[INVENTORY_NOTIFICATION] ${log.notificationType} - ${log.status}`,
    {
      recipient: log.recipient,
      reason: log.reason,
      timestamp: log.timestamp,
    }
  )
}

/**
 * Get all notification logs
 */
export async function getLogs(): Promise<NotificationLog[]> {
  return [...logs]
}

/**
 * Send a notification email
 */
export async function sendNotification(
  notificationType: NotificationType,
  emailData: NotificationEmailData,
  subject: string
): Promise<boolean> {
  const timestamp = new Date().toISOString()

  try {
    const isEnabled = await isNotificationEnabled(notificationType)

    if (!isEnabled) {
      // Check if we've already sent the "disabled" email
      if (!hasDisabledNotificationBeenSent(notificationType)) {
        // Send one-time disabled notification email
        const disabledEmailHTML = generateDisabledNotificationEmailHTML(
          NOTIFICATION_LABELS[notificationType],
          new Date().toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          })
        )

        await sendEmail({
          to: INVENTORY_NOTIFICATION_EMAIL,
          subject: 'Inventory Notifications Disabled',
          htmlContent: disabledEmailHTML,
        })

        markDisabledNotificationAsSent(notificationType)

        await logNotification({
          notificationType,
          recipient: INVENTORY_NOTIFICATION_EMAIL,
          status: 'SENT',
          reason: 'Disabled notification confirmation',
          timestamp,
        })
      }

      // Skip the actual notification
      await logNotification({
        notificationType,
        recipient: INVENTORY_NOTIFICATION_EMAIL,
        status: 'SKIPPED',
        reason: 'Disabled in Inventory Settings',
        timestamp,
      })

      return false
    }

    // Send the actual notification
    const emailHTML = generateNotificationEmailHTML(emailData)

    await sendEmail({
      to: INVENTORY_NOTIFICATION_EMAIL,
      subject,
      htmlContent: emailHTML,
    })

    await logNotification({
      notificationType,
      recipient: INVENTORY_NOTIFICATION_EMAIL,
      status: 'SENT',
      timestamp,
    })

    return true
  } catch (error) {
    console.error(`Error sending ${notificationType} notification:`, error)

    await logNotification({
      notificationType,
      recipient: INVENTORY_NOTIFICATION_EMAIL,
      status: 'SKIPPED',
      reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp,
    })

    return false
  }
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlert(productData: {
  productName: string
  sku: string
  warehouse: string
  currentStock: number
  threshold: number
  unit: string
  adminName?: string
}): Promise<boolean> {
  const emailData: NotificationEmailData = {
    greeting: `Hello ${productData.adminName || 'Admin'},`,
    notificationType: 'Low Stock Alert',
    details: [
      { label: 'Notification Type', value: 'Low Stock Alert' },
      { label: 'Product', value: productData.productName },
      { label: 'SKU', value: productData.sku },
      { label: 'Warehouse', value: productData.warehouse },
      { label: 'Current Stock', value: `${productData.currentStock} ${productData.unit}` },
      { label: 'Threshold', value: `${productData.threshold} ${productData.unit}` },
      {
        label: 'Date & Time',
        value: new Date().toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }),
      },
    ],
    remarks: 'Stock has fallen below the minimum level.',
    timestamp: new Date().toISOString(),
  }

  return sendNotification(
    NotificationType.LOW_STOCK,
    emailData,
    `Low Stock Alert: ${productData.productName}`
  )
}

/**
 * Send expiry alert
 */
export async function sendExpiryAlert(productData: {
  productName: string
  sku: string
  batchNumber: string
  expiryDate: string
  daysUntilExpiry: number
  warehouse: string
  adminName?: string
}): Promise<boolean> {
  const emailData: NotificationEmailData = {
    greeting: `Hello ${productData.adminName || 'Admin'},`,
    notificationType: 'Expiry Alert',
    details: [
      { label: 'Notification Type', value: 'Expiry Alert' },
      { label: 'Product', value: productData.productName },
      { label: 'SKU', value: productData.sku },
      { label: 'Batch Number', value: productData.batchNumber },
      { label: 'Expiry Date', value: productData.expiryDate },
      { label: 'Days Until Expiry', value: `${productData.daysUntilExpiry} days` },
      { label: 'Warehouse', value: productData.warehouse },
      {
        label: 'Date & Time',
        value: new Date().toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }),
      },
    ],
    remarks: `Product will expire in ${productData.daysUntilExpiry} days. Please review.`,
    timestamp: new Date().toISOString(),
  }

  return sendNotification(
    NotificationType.EXPIRY_ALERT,
    emailData,
    `Expiry Alert: ${productData.productName} - Batch ${productData.batchNumber}`
  )
}

/**
 * Send purchase order notification
 */
export async function sendPurchaseOrderNotification(poData: {
  poNumber: string
  supplier: string
  totalAmount: number
  items: number
  date: string
  adminName?: string
}): Promise<boolean> {
  const emailData: NotificationEmailData = {
    greeting: `Hello ${poData.adminName || 'Admin'},`,
    notificationType: 'Purchase Order',
    details: [
      { label: 'Notification Type', value: 'Purchase Order Created' },
      { label: 'PO Number', value: poData.poNumber },
      { label: 'Supplier', value: poData.supplier },
      { label: 'Total Items', value: `${poData.items} items` },
      { label: 'Total Amount', value: `₹${poData.totalAmount.toLocaleString('en-IN')}` },
      { label: 'Date', value: poData.date },
      {
        label: 'Generated On',
        value: new Date().toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }),
      },
    ],
    remarks: 'New purchase order has been created.',
    timestamp: new Date().toISOString(),
  }

  return sendNotification(
    NotificationType.PURCHASE_ORDER,
    emailData,
    `Purchase Order Created: ${poData.poNumber}`
  )
}

/**
 * Send GRN notification
 */
export async function sendGRNNotification(grnData: {
  grnNumber: string
  poNumber: string
  supplier: string
  totalItems: number
  date: string
  adminName?: string
}): Promise<boolean> {
  const emailData: NotificationEmailData = {
    greeting: `Hello ${grnData.adminName || 'Admin'},`,
    notificationType: 'Goods Receipt Note',
    details: [
      { label: 'Notification Type', value: 'Goods Receipt Note (GRN) Created' },
      { label: 'GRN Number', value: grnData.grnNumber },
      { label: 'PO Number', value: grnData.poNumber },
      { label: 'Supplier', value: grnData.supplier },
      { label: 'Total Items', value: `${grnData.totalItems} items` },
      { label: 'Date', value: grnData.date },
      {
        label: 'Generated On',
        value: new Date().toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }),
      },
    ],
    remarks: 'Goods have been received and documented.',
    timestamp: new Date().toISOString(),
  }

  return sendNotification(
    NotificationType.GRN,
    emailData,
    `GRN Created: ${grnData.grnNumber}`
  )
}

/**
 * Send stock adjustment notification
 */
export async function sendStockAdjustmentNotification(adjustmentData: {
  referenceNumber: string
  adjustmentType: string
  totalItems: number
  reason: string
  warehouse: string
  date: string
  adminName?: string
}): Promise<boolean> {
  const emailData: NotificationEmailData = {
    greeting: `Hello ${adjustmentData.adminName || 'Admin'},`,
    notificationType: 'Stock Adjustment',
    details: [
      { label: 'Notification Type', value: 'Stock Adjustment' },
      { label: 'Reference Number', value: adjustmentData.referenceNumber },
      { label: 'Adjustment Type', value: adjustmentData.adjustmentType },
      { label: 'Total Items', value: `${adjustmentData.totalItems} items` },
      { label: 'Reason', value: adjustmentData.reason },
      { label: 'Warehouse', value: adjustmentData.warehouse },
      { label: 'Date', value: adjustmentData.date },
      {
        label: 'Generated On',
        value: new Date().toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }),
      },
    ],
    remarks: 'Stock levels have been adjusted.',
    timestamp: new Date().toISOString(),
  }

  return sendNotification(
    NotificationType.STOCK_ADJUSTMENT,
    emailData,
    `Stock Adjustment: ${adjustmentData.referenceNumber}`
  )
}

/**
 * Send test notification
 */
export async function sendTestNotification(adminName: string = 'Admin'): Promise<boolean> {
  const emailData: NotificationEmailData = {
    greeting: `Hello ${adminName},`,
    notificationType: 'Test Notification',
    details: [
      { label: 'Notification Type', value: 'Test Email' },
      { label: 'Purpose', value: 'Configuration Verification' },
      {
        label: 'Sent At',
        value: new Date().toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }),
      },
    ],
    remarks: 'This is a test email sent from your inventory management system.',
    timestamp: new Date().toISOString(),
  }

  try {
    const emailHTML = generateNotificationEmailHTML(emailData)

    await sendEmail({
      to: INVENTORY_NOTIFICATION_EMAIL,
      subject: 'Test Email from Ayurshala Inventory System',
      htmlContent: emailHTML,
    })

    await logNotification({
      notificationType: 'TEST',
      recipient: INVENTORY_NOTIFICATION_EMAIL,
      status: 'SENT',
      reason: 'Manual test from Inventory Settings',
      timestamp: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('Error sending test notification:', error)

    await logNotification({
      notificationType: 'TEST',
      recipient: INVENTORY_NOTIFICATION_EMAIL,
      status: 'SKIPPED',
      reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    })

    return false
  }
}
