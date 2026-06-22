# Phase 4: Procurement & Vendor Management — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied.

---

## TC-1: Vendor Management (CRUD)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `POST /api/admin/vendors` with `{ name: "Clay Craft India", code: "VND-CCI", city: "Khurja" }` | Vendor created, returns 201 | |
| 1.2 | `GET /api/admin/vendors` | Returns vendor list with pagination | |
| 1.3 | Search: `?search=clay` | Filters by name | |
| 1.4 | `GET /api/admin/vendors/{id}` | Returns vendor with performance metrics | |
| 1.5 | `PUT /api/admin/vendors/{id}` with updated fields | Vendor updated | |
| 1.6 | `DELETE /api/admin/vendors/{id}` | Vendor deactivated (soft delete) | |
| 1.7 | Duplicate code → error | Returns 400 "already exists" | |

---

## TC-2: Purchase Order Creation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `POST /api/admin/purchase-orders` with vendorId + items | PO created with status "draft", returns 201 | |
| 2.2 | Verify PO number format: `PO-YYMM-XXXX` | Correct format | |
| 2.3 | Totals calculated (subtotal, discount, tax, grandTotal) | Math is correct | |
| 2.4 | Missing vendorId → 400 | Error returned | |
| 2.5 | Non-existent vendor → 404 | Error returned | |
| 2.6 | Items with discount: 10% off + 18% GST | Calculations correct | |

---

## TC-3: Purchase Order Lifecycle

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | draft → pending_approval | `PUT` updates status | |
| 3.2 | pending_approval → approved | approvedAt + approvedBy set | |
| 3.3 | approved → sent | sentAt set | |
| 3.4 | sent → partially_received | Status updates | |
| 3.5 | partially_received → received | receivedAt set | |
| 3.6 | received → invoiced | Terminal state | |
| 3.7 | invoiced → anything | Error: "Cannot transition" | |
| 3.8 | Any state → cancelled | cancelledAt set, cancellationReason saved | |

---

## TC-4: Goods Receipt

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `POST /api/admin/purchase-orders/{id}/receive` with items | Receipt created, stock updated | |
| 4.2 | Accepted qty increments variant stock | Stock = previous + acceptedQty | |
| 4.3 | Partial receipt → PO status becomes "partially_received" | Correct | |
| 4.4 | All lines fully received → PO status becomes "received" | Correct | |
| 4.5 | Rejected items require rejection reason | Validation error if missing | |
| 4.6 | Received > ordered → validation error | Error message | |
| 4.7 | StockAdjustment record created with reason "received" | Audit trail present | |

---

## TC-5: Vendor Performance

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | Get vendor detail after POs | Performance metrics include totalOrders, totalSpent | |
| 5.2 | On-time delivery rate calculated | Percentage based on received vs expected dates | |
| 5.3 | Rating: excellent (≥90%), good (75-89%), average (60-74%), poor (<60%) | Correct classification | |

---

## TC-6: Auto-Reorder Logic

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | `needsReorder(5, 10)` → true (stock ≤ safety level) | Correct | |
| 6.2 | `needsReorder(20, 10)` → false | Correct | |
| 6.3 | `needsReorder(5, 10, 10)` → false (pending PO covers) | Correct | |
| 6.4 | `calculateReorderQuantity(2, 7, 25, 30)` → 75 | Respects MOQ multiples | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/procurement.test.ts __tests__/api/admin-procurement.test.ts
npx playwright test e2e/procurement.spec.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/procurement.test.ts | Unit | 32 | ✅ All pass |
| api/admin-procurement.test.ts | Integration | 19 | ✅ All pass |
| e2e/procurement.spec.ts | E2E (Playwright) | 10 | ✅ All pass |
| **TOTAL** | **All types** | **61** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/vendors` | List vendors (search, filter, paginate) |
| POST | `/api/admin/vendors` | Create vendor |
| GET | `/api/admin/vendors/[id]` | Vendor detail + performance metrics |
| PUT | `/api/admin/vendors/[id]` | Update vendor |
| DELETE | `/api/admin/vendors/[id]` | Deactivate vendor |
| GET | `/api/admin/purchase-orders` | List POs (status filter, vendor filter) |
| POST | `/api/admin/purchase-orders` | Create PO with line items |
| GET | `/api/admin/purchase-orders/[id]` | PO detail with items + receipts |
| PUT | `/api/admin/purchase-orders/[id]` | Update PO status |
| POST | `/api/admin/purchase-orders/[id]/receive` | Record goods receipt + update stock |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
