/**
 * Inventory System Type Definitions
 * Used across services, APIs, and frontend
 */

// ============================================================
// CATEGORIES
// ============================================================
export interface InventoryCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  sort_order: number
  is_active: boolean
  is_deleted: boolean
  clinic_id?: string
  created_at: string
  updated_at: string
}

export interface CreateCategoryInput {
  name: string
  description?: string
  icon?: string
  sort_order?: number
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

// ============================================================
// PRODUCTS
// ============================================================
export interface InventoryProduct {
  id: string
  sku: string
  name: string
  description?: string
  category_id: string
  unit: string
  purchase_price: number
  sale_price: number
  mrp: number
  gst_percent: number
  hsn_code?: string
  reorder_level: number
  reorder_quantity: number
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  notes?: string
  clinic_id?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  sku: string
  name: string
  description?: string
  category_id: string
  unit: string
  purchase_price: number
  sale_price: number
  mrp: number
  gst_percent: number
  hsn_code?: string
  reorder_level?: number
  reorder_quantity?: number
  notes?: string
}

export interface UpdateProductInput {
  sku?: string
  name?: string
  description?: string
  category_id?: string
  unit?: string
  purchase_price?: number
  sale_price?: number
  mrp?: number
  gst_percent?: number
  hsn_code?: string
  reorder_level?: number
  reorder_quantity?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  notes?: string
}

// ============================================================
// SUPPLIERS
// ============================================================
export interface Supplier {
  id: string
  supplier_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  is_active: boolean
  notes?: string
  clinic_id?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreateSupplierInput {
  supplier_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  notes?: string
}

export interface UpdateSupplierInput {
  supplier_name?: string
  contact_person?: string
  mobile?: string
  email?: string
  gstin?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  is_active?: boolean
  notes?: string
}

// ============================================================
// PRODUCT-SUPPLIER RELATIONSHIP
// ============================================================
export interface ProductSupplier {
  product_id: string
  supplier_id: string
  is_preferred: boolean
  created_at: string
}

export interface LinkProductSupplierInput {
  supplier_id: string
  is_preferred?: boolean
}

// ============================================================
// UNITS
// ============================================================
export interface Unit {
  id: string
  name: string
  symbol: string
  base_unit?: string
  conversion_factor: number
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================================
// MANUFACTURERS
// ============================================================
export interface Manufacturer {
  id: string
  name: string
  gstin?: string
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  is_deleted: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateManufacturerInput {
  name: string
  gstin?: string
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  notes?: string
}

// ============================================================
// PRODUCT IMAGES
// ============================================================
export interface ProductImage {
  id: string
  product_id: string
  image_type: 'PRIMARY' | 'GALLERY' | 'LABEL' | 'MANUFACTURER'
  image_url: string
  alt_text?: string
  sort_order: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// PHASE 2+ TYPES (Pre-defined for future use)
// ============================================================

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  order_date: string
  expected_delivery_date?: string
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED'
  total_amount: number
  gst_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface GoodsReceivedNote {
  id: string
  grn_number: string
  purchase_order_id: string
  received_date: string
  status: 'DRAFT' | 'POSTED'
  created_at: string
  updated_at: string
}

export interface InventoryBatch {
  id: string
  product_id: string
  batch_number: string
  mfg_date: string
  exp_date: string
  quantity: number
  remaining_quantity: number
  purchase_price: number
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRED_PENDING_REMOVAL'
  created_at: string
  updated_at: string
}

export interface StockTransaction {
  id: string
  product_id: string
  batch_id?: string
  transaction_type: 'PURCHASE' | 'SALE' | 'CONSUMPTION' | 'RETURN' | 'ADJUSTMENT' | 'EXPIRED' | 'DAMAGED' | 'TRANSFER'
  quantity: number
  reference_id?: string
  reference_type?: string
  notes?: string
  created_at: string
  created_by: string
}

export interface StockLedger {
  id: string
  product_id: string
  transaction_date: string
  transaction_type: string
  reference_id?: string
  qty_in: number
  qty_out: number
  balance: number
  created_by: string
  created_at: string
}

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  status: number
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  status: number
}

// ============================================================
// VALIDATION ERRORS
// ============================================================
export interface ValidationError {
  field: string
  message: string
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed')
  }
}
