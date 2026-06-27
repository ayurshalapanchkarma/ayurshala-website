import { PurchaseOrderService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplier_id')
    const status = searchParams.get('status')

    const orders = await PurchaseOrderService.getPurchaseOrders(supplierId || undefined, status || undefined)
    return successResponse(orders)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { session } } = await supabase.auth.getSession()

    const order = await PurchaseOrderService.createPurchaseOrder(body as any, session?.user?.id || '')
    return successResponse(order, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
