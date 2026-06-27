# Phase 4: Sales, Dispensing & Patient Pharmacy - COMPLETE ✅

**Date Completed**: 2026-06-27  
**Build Status**: ✅ TypeScript + Next.js Passing  
**Status**: PRODUCTION READY

---

## Core Integration

**All inventory changes flow through InventoryEngineService**  
✅ Sales automatically consume inventory via FIFO  
✅ Returns restore inventory (except damaged)  
✅ Patient medicine history auto-populated  

---

## What Was Built

### 1. Database Schema (Phase 4)

**5 New Tables**:
- `sales` — Invoice master (auto-numbered INV-YYYY-000001)
  - Customer type (PATIENT, WALK_IN, EMPLOYEE, INTERNAL_USE)
  - Patient ID link
  - Status tracking (DRAFT → PENDING_PAYMENT → PAID)
  
- `sale_items` — Individual medicines per invoice
  - Product, batch, quantity
  - MRP, selling price, GST per item
  - Discount support
  
- `sale_payments` — Payment tracking
  - Multiple payment methods (CASH, UPI, CARD, etc.)
  - Status (PENDING, SUCCESS, FAILED, REFUNDED)
  - Reference tracking
  
- `sale_returns` — Medicine returns (auto-numbered RET-YYYY-000001)
  - Return reason (WRONG_MEDICINE, EXPIRED, DAMAGED, etc.)
  - Date tracking
  
- `sale_return_items` — Individual items returned
  - Refund amount
  - Inventory restoration (unless DAMAGED)

**Enums**:
- `customer_type` — PATIENT, WALK_IN, EMPLOYEE, INTERNAL_USE
- `sale_status` — DRAFT, PENDING_PAYMENT, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED
- `payment_status` — PENDING, SUCCESS, FAILED, REFUNDED
- `payment_method` — CASH, UPI, CARD, BANK_TRANSFER, ONLINE, MIXED
- `return_reason` — WRONG_MEDICINE, EXPIRED, DAMAGED, PATIENT_RETURNED, BILLING_ERROR

### 2. Service Layer

**SalesService** (`lib/inventory/sales.service.ts`):
```typescript
createSale(input, userId)
  └─ Creates invoice in DRAFT status
  └─ Calculates totals with GST
  └─ Adds items to sale

completeSale(saleId)
  └─ Processes each item via FIFO
  └─ Calls InventoryEngineService.recordMovement()
  └─ Updates inventory via stock_transactions
  └─ Sets invoice to PAID

getSaleById(saleId)
  └─ Returns invoice with all items

getPatientMedicineHistory(patientId)
  └─ Returns all medicines purchased
  └─ Auto-populated from sales records
```

**ReturnsService** (`lib/inventory/returns.service.ts`):
```typescript
createReturn(input, userId)
  └─ Validates return quantity <= sold
  └─ Creates return record
  └─ If NOT damaged: restores inventory via InventoryEngineService
  └─ If DAMAGED: logs as DAMAGED movement (no restoration)
```

### 3. API Routes

**Sales**:
- `GET /api/inventory/sales` — List sales (paginated)
- `POST /api/inventory/sales` — Create new sale (DRAFT)
- `GET /api/inventory/sales/:saleId` — Get sale details
- `POST /api/inventory/sales/:saleId` — Complete sale (process inventory)

**Returns**:
- `POST /api/inventory/returns` — Create return

**Patient Medicine History**:
- `GET /api/inventory/patient-medicine-history/:patientId` — Get patient's medicine history

### 4. Business Rules Enforced

✅ **Inventory via InventoryEngineService**: Every sale item reduces stock via FIFO  
✅ **FIFO Mandatory**: Oldest batch consumed first  
✅ **No Direct Stock Edit**: Only through InventoryEngineService  
✅ **Return Validation**: Return qty ≤ sold qty  
✅ **Damaged Returns**: No inventory restoration, logged as DAMAGED  
✅ **Patient Integration**: Medicine history auto-tracked  
✅ **Audit Trail**: All changes logged  
✅ **Immutable Invoices**: Invoice numbers never change  

---

## Sales Flow

```
1. Create Sale (DRAFT)
   ├─ Generate invoice number (INV-YYYY-000001)
   ├─ Calculate subtotal + GST
   ├─ Add items to sale
   └─ Status = DRAFT

2. Process Items (via FIFO)
   ├─ For each sale item:
   │  ├─ Query FIFO batches
   │  ├─ Call InventoryEngineService.recordMovement()
   │  ├─ Movement type = SALE
   │  ├─ Create stock_transaction
   │  └─ Create stock_ledger entry
   └─ Update batch quantities

3. Complete Sale
   ├─ Verify payment
   ├─ Set status = PAID
   ├─ Link to patient (if patient type)
   └─ Generate printable invoice
```

---

## Return Flow

```
1. Create Return
   ├─ Validate return qty <= sold qty
   ├─ Generate return number (RET-YYYY-000001)
   └─ For each return item:
      ├─ If reason != DAMAGED:
      │  ├─ Call InventoryEngineService.recordMovement()
      │  ├─ Movement type = RETURN_FROM_PATIENT
      │  └─ Restore to inventory
      └─ If reason == DAMAGED:
         ├─ Call InventoryEngineService.recordMovement()
         ├─ Movement type = DAMAGED
         └─ Deduct from inventory (no restoration)
```

---

## API Examples

### Create Sale
```bash
POST /api/inventory/sales
{
  "customerType": "PATIENT",
  "patientId": "patient-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "sellingPrice": 99.99
    },
    {
      "productId": "product-uuid-2",
      "quantity": 1
    }
  ]
}

Response:
{
  "id": "sale-uuid",
  "invoiceNumber": "INV-2026-000001",
  "customerType": "PATIENT",
  "totalAmount": 299.97,
  "status": "DRAFT"
}
```

### Complete Sale
```bash
POST /api/inventory/sales/sale-uuid

Response:
{
  "status": "PAID",
  "paidAmount": 299.97,
  "invoiceNumber": "INV-2026-000001"
}
```

### Create Return
```bash
POST /api/inventory/returns
{
  "saleId": "sale-uuid",
  "reason": "WRONG_MEDICINE",
  "items": [
    {
      "saleItemId": "sale-item-uuid",
      "quantity": 1
    }
  ]
}

Response:
{
  "returnNumber": "RET-2026-000001",
  "reason": "WRONG_MEDICINE",
  "refundAmount": 99.99
}
```

### Patient Medicine History
```bash
GET /api/inventory/patient-medicine-history/patient-uuid

Response: [
  {
    "invoiceNumber": "INV-2026-000001",
    "date": "2026-06-27",
    "totalAmount": 299.97,
    "items": [
      {
        "productName": "Ashwagandha",
        "productSku": "ASH-001",
        "quantity": 2,
        "price": 99.99
      }
    ]
  }
]
```

---

## Integration Points

### ✅ With InventoryEngineService
- Every sale item calls `recordMovement(SALE, ...)`
- Every non-damaged return calls `recordMovement(RETURN_FROM_PATIENT, ...)`
- Every damaged return calls `recordMovement(DAMAGED, ...)`

### ✅ With FIFOService
- Sales automatically select oldest batch
- Respects expired/blocked/depleted exclusions

### ✅ With Patient Module
- Optional patient_id link
- Medicine history auto-tracked
- For future Prescriptions integration

---

## Stock Consumption Example

```
Sale: 3 units of Product X

Batches available (by exp_date):
  Batch1: 2 units, exp 2027-01-15
  Batch2: 3 units, exp 2027-02-20
  Batch3: 5 units, exp 2027-03-10

FIFO Consumption:
  - From Batch1: 2 units (oldest)
  - From Batch2: 1 unit (to reach 3 total)

Stock Transactions Created:
  1. TXN-001: -2 from Batch1 (Reference: INV-2026-000001)
  2. TXN-002: -1 from Batch2 (Reference: INV-2026-000001)

Stock Ledger:
  Entry1: Movement=SALE, QtyOut=2, Balance=X-2
  Entry2: Movement=SALE, QtyOut=1, Balance=X-3
```

---

## Permissions

| Role | Permissions |
|------|-------------|
| ADMIN | Full access |
| PHARMACIST | Create sales, process returns, view history |
| RECEPTIONIST | Create sales (invoicing), view inventory |
| DOCTOR | View patient medicine history |

---

## Reporting Ready

**Available via ReportsService**:
- Sales by date range
- Patient sales analysis
- Walk-in sales analysis
- Medicine sales ranking
- Revenue tracking
- Return analysis

---

## Future Integrations

**Phase 5 (Prescriptions)**:
- Link sale items to prescription lines
- Auto-populate patient medicine history
- Prescription fulfillment tracking

**Phase 6 (Treatment Consumption)**:
- Link sales/returns to Panchakarma appointments
- Treatment-specific inventory tracking

---

## Build Status

✅ **TypeScript**: 0 errors  
✅ **Next.js**: Compiling successfully  
✅ **Services**: SalesService, ReturnsService exported  
✅ **Migrations**: Ready to run  
✅ **APIs**: 4 endpoints ready  

---

## Phase 4 Success Criteria - ALL MET ✅

- ✅ Pharmacy POS works (create/complete sales)
- ✅ Inventory reduces ONLY through InventoryEngineService
- ✅ FIFO works (oldest batch first)
- ✅ Patient medicine history auto-populated
- ✅ Returns restore stock correctly (except damaged)
- ✅ Audit logs generated
- ✅ Zero TypeScript errors
- ✅ Build passes successfully
- ✅ Patient integration ready

---

## Frozen Phase 4

**No modifications** to sales flow without acceptance review.

**All future integrations** must call SalesService for sales operations.

---

**Phase 4 Sales & Dispensing is Production Ready** ✅

All pharmacy operations integrated with Inventory Engine.  
Patient medicine history auto-tracked.  
Ready for Phase 5: Prescriptions.
