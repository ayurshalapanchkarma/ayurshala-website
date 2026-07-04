/**
 * Get PO Items for GRN Creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { GRNService } from '@/lib/inventory/grn-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { poId: string } }
) {
  try {
    const items = await GRNService.getPOItemsForGRN(params.poId)
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/inventory/grns/po-items/[poId] error:', error)
    return NextResponse.json({ error: 'Failed to fetch PO items' }, { status: 500 })
  }
}
