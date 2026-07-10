/**
 * Inventory Notification Service
 * Handles sending notifications based on settings
 */

'use server'

import { SettingsService } from './settings.service'
import { EmailService } from './email.service'
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

class NotificationServiceClass {
  private logs: NotificationLog[] = []

  /**
   * Check if a notification type is enabled in settings
   */
  private async isNotificationEnabled(notificationType: NotificationType): Promise<boolean> {
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
   * Send a notification email
   */
  async sendNotification(
    notificationType: NotificationType,
    emailData: NotificationEmailData,
    subject: string
  ): Promise<boolean> {
    const timestamp = new Date().toISOString()

    try {
      const isEnabled = await this.isNotificationEnabled(notificationType)

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

          await EmailService.sendEmail({
            to: INVENTORY_NOTIFICATION_EMAIL,
            subject: 'Inventory Notifications Disabled',
            htmlContent: disabledEmailHTML,
          })

          markDisabledNotificationAsSent(notificationType)

          this.log({
            notificationType,
            recipient: INVENTORY_NOTIFICATION_EMAIL,
            status: 'SENT',
            reason: 'Disabled notification confirmation',
            timestamp,
          })
        }

        // Skip the actual notification
        this.log({
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

      await EmailService.sendEmail({
        to: INVENTORY_NOTIFICATION_EMAIL,
        subject,
        htmlContent: emailHTML,
      })

      this.log({
        notificationType,
        recipient: INVENTORY_NOTIFICATION_EMAIL,
        status: 'SENT',
        timestamp,
      })

      return true
    } catch (error) {
      console.error(`Error sending ${notificationType} notification:`, error)

      this.log({
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
  async sendLowStockAlert(productData: {
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

    return this.sendNotification(
      NotificationType.LOW_STOCK,
      emailData,
      `Low Stock Alert: ${productData.productName}`
    )
  }

  /**
   * Send expiry alert
   */
  async sendExpiryAlert(productData: {
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

    return this.sendNotification(
      NotificationType.EXPIRY_ALERT,
      emailData,
      `Expiry Alert: ${productData.productName} - Batch ${productData.batchNumber}`
    )
  }

  /**
   * Send purchase order notification
   */
  async sendPurchaseOrderNotification(poData: {
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
      remarks: 'A new purchase order has been created.',
      timestamp: new Date().toISOString(),
    }

    return this.sendNotification(
      NotificationType.PURCHASE_ORDER,
      emailData,
      `Purchase Order Created: ${poData.poNumber}`
    )
  }

  /**
   * Send GRN notification
   */
  async sendGRNNotification(grnData: {
    grnNumber: string
    poNumber: string
    supplier: string
    totalItems: number
    date: string
    adminName?: string
  }): Promise<boolean> {
    const emailData: NotificationEmailData = {
      greeting: `Hello ${grnData.adminName || 'Admin'},`,
      notificationType: 'GRN',
      details: [
        { label: 'Notification Type', value: 'Goods Receipt Note' },
        { label: 'GRN Number', value: grnData.grnNumber },
        { label: 'PO Number', value: grnData.poNumber },
        { label: 'Supplier', value: grnData.supplier },
        { label: 'Items Received', value: `${grnData.totalItems} items` },
        { label: 'Date', value: grnData.date },
        {
          label: 'Received On',
          value: new Date().toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          }),
        },
      ],
      remarks: 'Goods have been successfully received and recorded in the system.',
      timestamp: new Date().toISOString(),
    }

    return this.sendNotification(NotificationType.GRN, emailData, `GRN Received: ${grnData.grnNumber}`)
  }

  /**
   * Send stock adjustment notification
   */
  async sendStockAdjustmentNotification(adjustmentData: {
    adjustmentNumber: string
    reason: string
    totalItems: number
    date: string
    adminName?: string
  }): Promise<boolean> {
    const emailData: NotificationEmailData = {
      greeting: `Hello ${adjustmentData.adminName || 'Admin'},`,
      notificationType: 'Stock Adjustment',
      details: [
        { label: 'Notification Type', value: 'Stock Adjustment' },
        { label: 'Adjustment Number', value: adjustmentData.adjustmentNumber },
        { label: 'Reason', value: adjustmentData.reason },
        { label: 'Items Affected', value: `${adjustmentData.totalItems} items` },
        { label: 'Date', value: adjustmentData.date },
        {
          label: 'Adjusted On',
          value: new Date().toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          }),
        },
      ],
      remarks: 'Stock inventory has been adjusted in the system.',
      timestamp: new Date().toISOString(),
    }

    return this.sendNotification(
      NotificationType.STOCK_ADJUSTMENT,
      emailData,
      `Stock Adjustment: ${adjustmentData.adjustmentNumber}`
    )
  }

  /**
   * Send test notification
   */
  async sendTestNotification(adminName: string = 'Admin'): Promise<boolean> {
    const emailData: NotificationEmailData = {
      greeting: `Hello ${adminName},`,
      notificationType: 'Test Notification',
      details: [
        { label: 'Notification Type', value: 'System Test' },
        { label: 'Purpose', value: 'Email Configuration Verification' },
        { label: 'Email Template', value: 'Ayurshala Branded' },
        {
          label: 'Timestamp',
          value: new Date().toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          }),
        },
      ],
      remarks: 'This is a test email to verify your notification system configuration.',
      timestamp: new Date().toISOString(),
    }

    try {
      const emailHTML = generateNotificationEmailHTML(emailData)
      await EmailService.sendEmail({
        to: INVENTORY_NOTIFICATION_EMAIL,
        subject: 'Test Notification - Ayurshala Inventory System',
        htmlContent: emailHTML,
      })

      this.log({
        notificationType: 'TEST',
        recipient: INVENTORY_NOTIFICATION_EMAIL,
        status: 'SENT',
        reason: 'Test email sent successfully',
        timestamp: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error('Error sending test notification:', error)

      this.log({
        notificationType: 'TEST',
        recipient: INVENTORY_NOTIFICATION_EMAIL,
        status: 'SKIPPED',
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      })

      return false
    }
  }

  /**
   * Log notification event
   */
  private log(log: NotificationLog): void {
    this.logs.push(log)
    console.log(`[INVENTORY_NOTIFICATION] ${log.notificationType} - ${log.status}`, {
      recipient: log.recipient,
      reason: log.reason,
      timestamp: log.timestamp,
    })
  }

  /**
   * Get all logs
   */
  getLogs(): NotificationLog[] {
    return this.logs
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }
}

export const NotificationService = new NotificationServiceClass()
