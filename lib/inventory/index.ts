/**
 * Inventory Module Exports
 * Central import point for all inventory services and types
 */

// Phase 1: Master Data
export { CategoryService } from './category.service'
export { ProductService } from './product.service'
export { SupplierService } from './supplier.service'
export { UnitService } from './unit.service'
export { ManufacturerService } from './manufacturer.service'

// Phase 2: Purchase Management
export { PurchaseOrderService } from './purchase.service'
export { GRNService } from './grn.service'
export { BatchService } from './batch.service'

// Phase 3: Inventory Engine (Core Stock Authority)
export { InventoryEngineService } from './inventory-engine.service'
export { FIFOService } from './fifo.service'
export { ExpiryService, AlertService } from './expiry-alert.service'
export { ReportsService } from './reports.service'

// Phase 4: Sales & Dispensing
export { SalesService } from './sales.service'
export { ReturnsService } from './returns.service'

// Phase 5: Prescriptions & Treatment Planning
export { PrescriptionService } from './prescription.service'

// Phase 6: Panchakarma Treatment Execution
export { TreatmentService } from './treatment.service'
export { TherapistService } from './therapist.service'
export { RoomService } from './room.service'
export { RecipeService } from './recipe.service'

// Phase 7: Finance & Billing
export { FinanceService } from './finance.service'
export { PackageService } from './package.service'
export { ReportsService as FinanceReportsService } from './reports-finance.service'

// Phase 8: CRM & Patient Engagement
export { CRMService } from './crm.service'
export { CommunicationService } from './communication.service'
export { CampaignService } from './campaign.service'

// Phase 9: Analytics & Business Intelligence
export { AnalyticsService } from './analytics.service'

// Phase 10: Master Settings & ERP Foundation
export { SettingsService } from './settings.service'
export * from './notification.service'

// Phase 11: Human Resource Management
export { HRMSService } from './hrms.service'

// Phase 12: Patient Portal, Mobile APIs & Public API Platform
export { PatientPortalService } from './portal.service'
export { APIGatewayService } from './api-gateway.service'

// Phase 13: AI Assistant, Automation & Clinical Intelligence
export { AIService } from './ai.service'

// Helpers
export { handleApiError, ApiError, successResponse, errorResponse, parseBody, getParam } from './api-helper'

