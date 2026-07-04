import { NextRequest, NextResponse } from 'next/server';

// RBAC Permissions matrix
const PERMISSIONS_MATRIX: Record<string, string[]> = {
  ADMIN: ['*'], // Admin has all permissions

  PHARMACIST: [
    'pharmacy:view_pos',
    'pharmacy:create_bill',
    'pharmacy:complete_bill',
    'pharmacy:view_invoices',
    'pharmacy:create_return',
    'pharmacy:view_dashboard',
    'pharmacy:view_reports',
    'inventory:view_stock'
  ],

  RECEPTION: [
    'pharmacy:view_pos',
    'pharmacy:create_bill',
    'pharmacy:view_dashboard',
    'billing:create_invoice',
    'billing:view_invoices',
    'billing:record_payment'
  ],

  CASHIER: [
    'billing:view_invoices',
    'billing:record_payment',
    'billing:view_payments',
    'billing:daily_closing',
    'billing:view_collections'
  ],

  DOCTOR: [
    'billing:view_revenue',
    'patient:view_ledger',
    'consultation:create',
    'treatment:create'
  ],

  BILLING_MANAGER: [
    'billing:*',
    'patient:view_ledger',
    'billing:daily_closing',
    'billing:refunds',
    'billing:reports'
  ]
};

export async function checkPermission(
  role: string,
  requiredPermission: string
): Promise<boolean> {
  const permissions = PERMISSIONS_MATRIX[role] || [];

  if (permissions.includes('*')) return true;
  if (permissions.includes(requiredPermission)) return true;

  // Check wildcard permissions (e.g., 'billing:*')
  const [module, action] = requiredPermission.split(':');
  if (permissions.includes(`${module}:*`)) return true;

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('X-User-Role') || 'RECEPTION';
    const requiredPermission = request.nextUrl.searchParams.get('permission') || '';

    if (!requiredPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission not specified' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission(userRole, requiredPermission);

    return NextResponse.json({
      success: true,
      hasPermission,
      role: userRole,
      permission: requiredPermission
    }, { status: 200 });
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { success: false, error: 'Permission check failed' },
      { status: 500 }
    );
  }
}
