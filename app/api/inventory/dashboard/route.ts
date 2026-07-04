/**
 * Inventory Dashboard API - Module 6
 * Aggregate dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { StockService } from '@/lib/inventory/stock-service'
import { PurchaseOrderService } from '@/lib/inventory/purchase-order-service'
import { GRNService } from '@/lib/inventory/grn-service'

export async function GET(request: NextRequest) {
  try {
    const [stockStats, poStats, grnStats] = await Promise.all([
      StockService.getDashboardStats(),
      PurchaseOrderService.getPOStats(),
      GRNService.getGRNStats(),
    ])

    return NextResponse.json({
      stock: stockStats,
      purchaseOrders: poStats,
      grn: grnStats,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/inventory/dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
