# Phase 5: Warehouse Management System (WMS) — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied.

---

## TC-1: Bin/Location Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `POST /api/admin/wms/bins` with `{ warehouseId, zone: "A", aisle: 1, shelf: 2, position: 3 }` | Bin created with code "ZA-A01-S02-P03", returns 201 | |
| 1.2 | `GET /api/admin/wms/bins` | Returns all bins sorted by zone/aisle/shelf/position | |
| 1.3 | Filter by zone: `?zone=A` | Only Zone A bins | |
| 1.4 | Filter by type: `?type=picking` | Only picking bins | |
| 1.5 | Duplicate bin code → 400 error | Cannot create same location twice | |
| 1.6 | Missing required fields → 400 | Error message | |

---

## TC-2: Pick List Generation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `POST /api/admin/wms/pick-lists` with `{ orderIds: [...], warehouseId }` | Pick list created with optimized item order | |
| 2.2 | Response includes `optimization` (estimatedTime, zones, totalQuantity) | All fields present | |
| 2.3 | Items sorted by zone → aisle → position (serpentine) | Efficient pick path | |
| 2.4 | `GET /api/admin/wms/pick-lists` | Returns pick lists | |
| 2.5 | Filter by status: `?status=pending` | Only pending lists | |
| 2.6 | Empty orderIds → 400 error | Validation error | |
| 2.7 | No eligible order items → 400 | "No eligible items found" | |

---

## TC-3: Packing Workflow

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `POST /api/admin/wms/pack` with orderId, weight, dimensions, verified items | Pack session created, shipping label generated | |
| 3.2 | Response includes `shippingLabel` with fromAddress, toAddress, barcode, metadata | All present | |
| 3.3 | COD order → label shows COD amount | `₹{total}` in metadata | |
| 3.4 | Prepaid order → label shows "Prepaid" | Correct | |
| 3.5 | Unverified items → 400 error | "not verified via barcode scan" | |
| 3.6 | Zero weight → 400 error | "Weight must be positive" | |
| 3.7 | Oversized package → success with warning | Warning about courier limits | |
| 3.8 | Missing orderId → 400 | Validation error | |

---

## TC-4: Cycle Counting

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `POST /api/admin/wms/cycle-counts` with `{ warehouseId, scheduledAt }` | Cycle count scheduled, returns 201 | |
| 4.2 | `GET /api/admin/wms/cycle-counts` | Returns list of cycle counts | |
| 4.3 | `PUT /api/admin/wms/cycle-counts` with `{ cycleCountId, items: [...] }` | Results analyzed, discrepancies identified | |
| 4.4 | Response includes analysis: totalBins, matchedBins, discrepancies[], accuracyRate | All calculated correctly | |
| 4.5 | All bins match → accuracyRate = 100% | Correct | |
| 4.6 | Discrepancies show variance (actual - expected) | Correct math | |

---

## TC-5: Warehouse Performance Metrics

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `calculatePerformance(120, 40, 2, 4, 3600, 2400)` | picksPerHour=30, packsPerHour=10, accuracy=96.7% | |
| 5.2 | Zero hours → all rates are 0 | No division errors | |
| 5.3 | Zero errors → accuracy = 100% | Correct | |

---

## TC-6: Shipping Label Generation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | Generate label with tracking number | Barcode = tracking number | |
| 6.2 | Generate label without tracking | Barcode = order number | |
| 6.3 | Label includes: fromAddress (Uyarvom), toAddress, all metadata | Complete data | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/wms.test.ts __tests__/api/admin-wms.test.ts
npx playwright test e2e/wms.spec.ts --timeout=15000
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/wms.test.ts | Unit | 27 | ✅ All pass |
| api/admin-wms.test.ts | Integration | 15 | ✅ All pass |
| e2e/wms.spec.ts | E2E (Playwright) | 8 | ✅ All pass |
| **TOTAL** | **All types** | **50** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/wms/bins` | List bins (filter by warehouse/zone/type) |
| POST | `/api/admin/wms/bins` | Create bin location |
| GET | `/api/admin/wms/pick-lists` | List pick lists |
| POST | `/api/admin/wms/pick-lists` | Generate optimized pick list from orders |
| POST | `/api/admin/wms/pack` | Confirm pack + generate shipping label |
| GET | `/api/admin/wms/cycle-counts` | List cycle counts |
| POST | `/api/admin/wms/cycle-counts` | Schedule cycle count |
| PUT | `/api/admin/wms/cycle-counts` | Submit results + analysis |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
