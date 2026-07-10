/**
 * Inventory Notification Configuration
 * Centralized configuration for all inventory-related notifications
 */

// Recipient email configuration - change this one place to update all notifications
export const INVENTORY_NOTIFICATION_EMAIL = process.env.INVENTORY_NOTIFICATION_EMAIL || 'ayurshalapanchkarma@gmail.com'

// Notification types
export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRY_ALERT = 'EXPIRY_ALERT',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  GRN = 'GRN',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
}

// Notification setting keys in inventory settings
export const NOTIFICATION_SETTINGS_KEYS = {
  [NotificationType.LOW_STOCK]: 'email_low_stock_alerts',
  [NotificationType.EXPIRY_ALERT]: 'email_expiry_alerts',
  [NotificationType.PURCHASE_ORDER]: 'email_purchase_alerts',
  [NotificationType.GRN]: 'email_grn_alerts',
  [NotificationType.STOCK_ADJUSTMENT]: 'email_adjustment_alerts',
} as const

// Notification display labels
export const NOTIFICATION_LABELS = {
  [NotificationType.LOW_STOCK]: 'Low Stock Alerts',
  [NotificationType.EXPIRY_ALERT]: 'Expiry Alerts',
  [NotificationType.PURCHASE_ORDER]: 'Purchase Alerts',
  [NotificationType.GRN]: 'GRN Alerts',
  [NotificationType.STOCK_ADJUSTMENT]: 'Stock Adjustment Alerts',
} as const

// Track which notification types have sent the "disabled" email
// In production, this should be persisted in the database
const disabledNotificationsSent = new Set<string>()

export function hasDisabledNotificationBeenSent(notificationType: string): boolean {
  return disabledNotificationsSent.has(notificationType)
}

export function markDisabledNotificationAsSent(notificationType: string): void {
  disabledNotificationsSent.add(notificationType)
}
