// Inventory permission utility
// Checks if user has access to inventory features

export enum InventoryRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PHARMACIST = 'PHARMACIST',
  DOCTOR = 'DOCTOR',
  THERAPIST = 'THERAPIST',
  RECEPTION = 'RECEPTION',
  FINANCE = 'FINANCE',
  HR = 'HR',
  PATIENT = 'PATIENT',
  GUEST = 'GUEST',
}

export enum InventoryPermission {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
}

// Default role permissions
const rolePermissions: Record<InventoryRole, InventoryPermission[]> = {
  [InventoryRole.SUPER_ADMIN]: [
    InventoryPermission.READ,
    InventoryPermission.CREATE,
    InventoryPermission.UPDATE,
    InventoryPermission.DELETE,
    InventoryPermission.EXPORT,
  ],
  [InventoryRole.ADMIN]: [
    InventoryPermission.READ,
    InventoryPermission.CREATE,
    InventoryPermission.UPDATE,
    InventoryPermission.DELETE,
    InventoryPermission.EXPORT,
  ],
  [InventoryRole.PHARMACIST]: [
    InventoryPermission.READ,
    InventoryPermission.CREATE,
    InventoryPermission.UPDATE,
    InventoryPermission.EXPORT,
  ],
  [InventoryRole.FINANCE]: [InventoryPermission.READ, InventoryPermission.EXPORT],
  [InventoryRole.DOCTOR]: [],
  [InventoryRole.THERAPIST]: [],
  [InventoryRole.RECEPTION]: [],
  [InventoryRole.HR]: [],
  [InventoryRole.PATIENT]: [],
  [InventoryRole.GUEST]: [],
}

export function canAccessInventory(role?: string): boolean {
  if (!role) return false
  const permissions = rolePermissions[role as InventoryRole]
  return permissions && permissions.length > 0
}

export function hasPermission(role?: string, permission?: InventoryPermission): boolean {
  if (!role || !permission) return false
  const permissions = rolePermissions[role as InventoryRole]
  return permissions && permissions.includes(permission)
}

export function getInventoryPermissions(role?: string): InventoryPermission[] {
  if (!role) return []
  return rolePermissions[role as InventoryRole] || []
}
