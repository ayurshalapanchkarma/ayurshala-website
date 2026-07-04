/**
 * Validation utilities for inventory master data
 * Ensures data integrity and consistency
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export class InventoryValidators {
  /**
   * Validate GSTIN (Indian GST Identification Number)
   * Format: 15 alphanumeric characters
   */
  static validateGSTIN(gstin?: string): { valid: boolean; error?: string } {
    if (!gstin) return { valid: true } // Optional field
    if (!/^[0-9A-Z]{15}$/.test(gstin)) {
      return { valid: false, error: 'GSTIN must be 15 alphanumeric characters' }
    }
    return { valid: true }
  }

  /**
   * Validate PAN (Permanent Account Number)
   * Format: 10 alphanumeric characters
   */
  static validatePAN(pan?: string): { valid: boolean; error?: string } {
    if (!pan) return { valid: true } // Optional field
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return { valid: false, error: 'Invalid PAN format' }
    }
    return { valid: true }
  }

  /**
   * Validate Indian mobile number
   * Format: 10 digits starting with 6-9
   */
  static validateMobile(mobile?: string): { valid: boolean; error?: string } {
    if (!mobile) return { valid: true } // Optional field
    if (!/^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''))) {
      return { valid: false, error: 'Invalid mobile number' }
    }
    return { valid: true }
  }

  /**
   * Validate email
   */
  static validateEmail(email?: string): { valid: boolean; error?: string } {
    if (!email) return { valid: true } // Optional field
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Invalid email format' }
    }
    return { valid: true }
  }

  /**
   * Validate category
   */
  static validateCategory(input: any): ValidationResult {
    const errors: Record<string, string> = {}

    if (!input.name?.trim()) {
      errors.name = 'Category name is required'
    } else if (input.name.length > 100) {
      errors.name = 'Category name must be less than 100 characters'
    }

    if (input.description && input.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Validate unit
   */
  static validateUnit(input: any): ValidationResult {
    const errors: Record<string, string> = {}

    if (!input.name?.trim()) {
      errors.name = 'Unit name is required'
    } else if (input.name.length > 100) {
      errors.name = 'Unit name must be less than 100 characters'
    }

    if (!input.short_name?.trim()) {
      errors.short_name = 'Short name is required'
    } else if (input.short_name.length > 20) {
      errors.short_name = 'Short name must be less than 20 characters'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Validate manufacturer
   */
  static validateManufacturer(input: any): ValidationResult {
    const errors: Record<string, string> = {}

    if (!input.manufacturer_name?.trim()) {
      errors.manufacturer_name = 'Manufacturer name is required'
    } else if (input.manufacturer_name.length > 200) {
      errors.manufacturer_name = 'Name must be less than 200 characters'
    }

    if (input.email) {
      const emailValidation = this.validateEmail(input.email)
      if (!emailValidation.valid) {
        errors.email = emailValidation.error || 'Invalid email'
      }
    }

    if (input.gst_number) {
      const gstValidation = this.validateGSTIN(input.gst_number)
      if (!gstValidation.valid) {
        errors.gst_number = gstValidation.error || 'Invalid GSTIN'
      }
    }

    if (input.mobile) {
      const mobileValidation = this.validateMobile(input.mobile)
      if (!mobileValidation.valid) {
        errors.mobile = mobileValidation.error || 'Invalid mobile'
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Validate supplier
   */
  static validateSupplier(input: any): ValidationResult {
    const errors: Record<string, string> = {}

    if (!input.company_name?.trim()) {
      errors.company_name = 'Company name is required'
    } else if (input.company_name.length > 200) {
      errors.company_name = 'Company name must be less than 200 characters'
    }

    if (input.email) {
      const emailValidation = this.validateEmail(input.email)
      if (!emailValidation.valid) {
        errors.email = emailValidation.error || 'Invalid email'
      }
    }

    if (input.gst_number) {
      const gstValidation = this.validateGSTIN(input.gst_number)
      if (!gstValidation.valid) {
        errors.gst_number = gstValidation.error || 'Invalid GSTIN'
      }
    }

    if (input.pan) {
      const panValidation = this.validatePAN(input.pan)
      if (!panValidation.valid) {
        errors.pan = panValidation.error || 'Invalid PAN'
      }
    }

    if (input.mobile) {
      const mobileValidation = this.validateMobile(input.mobile)
      if (!mobileValidation.valid) {
        errors.mobile = mobileValidation.error || 'Invalid mobile'
      }
    }

    if (input.credit_days !== undefined && input.credit_days < 0) {
      errors.credit_days = 'Credit days cannot be negative'
    }

    if (input.credit_limit !== undefined && input.credit_limit < 0) {
      errors.credit_limit = 'Credit limit cannot be negative'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Validate product
   */
  static validateProduct(input: any): ValidationResult {
    const errors: Record<string, string> = {}

    if (!input.product_name?.trim()) {
      errors.product_name = 'Product name is required'
    } else if (input.product_name.length > 200) {
      errors.product_name = 'Product name must be less than 200 characters'
    }

    if (!input.category_uuid) {
      errors.category_uuid = 'Category is required'
    }

    if (!input.unit_uuid) {
      errors.unit_uuid = 'Unit is required'
    }

    if (input.purchase_price === undefined || input.purchase_price === null) {
      errors.purchase_price = 'Purchase price is required'
    } else if (input.purchase_price < 0) {
      errors.purchase_price = 'Purchase price cannot be negative'
    }

    if (input.selling_price === undefined || input.selling_price === null) {
      errors.selling_price = 'Selling price is required'
    } else if (input.selling_price < 0) {
      errors.selling_price = 'Selling price cannot be negative'
    }

    if (input.mrp === undefined || input.mrp === null) {
      errors.mrp = 'MRP is required'
    } else if (input.mrp < 0) {
      errors.mrp = 'MRP cannot be negative'
    } else if (input.mrp < input.selling_price) {
      errors.mrp = 'MRP must be greater than or equal to selling price'
    }

    if (input.gst_percentage === undefined || input.gst_percentage === null) {
      errors.gst_percentage = 'GST percentage is required'
    } else if (input.gst_percentage < 0 || input.gst_percentage > 100) {
      errors.gst_percentage = 'GST percentage must be between 0 and 100'
    }

    if (input.minimum_stock === undefined || input.minimum_stock === null) {
      errors.minimum_stock = 'Minimum stock is required'
    } else if (input.minimum_stock < 0) {
      errors.minimum_stock = 'Minimum stock cannot be negative'
    }

    if (input.reorder_level === undefined || input.reorder_level === null) {
      errors.reorder_level = 'Reorder level is required'
    } else if (input.reorder_level < input.minimum_stock) {
      errors.reorder_level = 'Reorder level must be >= minimum stock'
    }

    if (input.maximum_stock !== undefined && input.maximum_stock !== null) {
      if (input.maximum_stock < input.minimum_stock) {
        errors.maximum_stock = 'Maximum stock must be >= minimum stock'
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Check if name is unique (must query database)
   */
  static async checkUniqueName(
    tableName: string,
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    // This will be implemented in the service layer using Supabase
    return true
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
