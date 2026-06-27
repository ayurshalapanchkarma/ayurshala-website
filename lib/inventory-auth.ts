// Inventory authorization middleware
// This should be called in layout or page to check permissions before rendering

import { canAccessInventory } from './inventory-permission'

export function checkInventoryAccess(userRole?: string): { allowed: boolean; redirectTo?: string } {
  if (!userRole || !canAccessInventory(userRole)) {
    return { allowed: false, redirectTo: '/dashboard/inventory/unauthorized' }
  }
  return { allowed: true }
}
