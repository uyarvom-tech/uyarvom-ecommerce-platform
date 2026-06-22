# Phase 2: Inventory Management — UAT Manual Testing Guide

> **Version:** 1.0
> **Date:** June 2026
> **Objective:** Validate all inventory management features are working correctly.
> **Prerequisites:** Dev server running, admin access, database with products seeded, Prisma migration applied.

---

## Setup: Apply Database Migration

Before testing Phase 2 features, run the migration to create new tables:

```bash
npx prisma db push
```

This creates: `warehouses`, `warehouse_stocks`, `stock_transfers`, `stock_transfer_items`, `stock_adjustments`, `batch_lots`

---

## TC-1: Inventory Dashboard

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | Navigate to `/admin/inventory` | Inventory page loads with stock table | |
| 1.2 | Verify stock list shows all products | Products listed with: Name, SKU, Threshold, Variant Stock, Low Variants, Status | |
| 1.3 | Products sorted by stock ascending (lowest first) | Out-of-stock products appear at top | |
| 1.4 | Verify status badges: "Void" (red), "Low" (amber), "Optimal" (green) | Correct colors based on stock vs threshold | |
| 1.5 | Verify Critical Alerts sidebar | Shows out-of-stock count and low-stock count | |
| 1.6 | Verify Adjustment Feed | Shows last 10 stock adjustments with actor and date | |

---

## TC-2: Stock Adjustment (with Reason Codes)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `POST /api/admin/inventory/adjust` with `{ variantId, type: "increment", quantity: 10, reason: "received" }` | Returns 200 with new stock = previous + 10 | |
| 2.2 | Verify `previousStock` and `newStock` in response | Correct before/after values | |
| 2.3 | Decrement stock: `type: "decrement", quantity: 3, reason: "damaged"` | Stock decreases by 3 | |
| 2.4 | Set absolute stock: `type: "set", quantity: 50, reason: "correction"` | Stock becomes exactly 50 | |
| 2.5 | Try decrement more than available: `quantity: 999, reason: "lost"` | Returns 400 "Insufficient stock" | |
| 2.6 | Try invalid reason: `reason: "random"` | Returns 400 "Invalid reason" | |
| 2.7 | Try missing fields | Returns 400 with error message | |
| 2.8 | Try non-existent variantId | Returns 404 "Variant not found" | |
| 2.9 | Verify adjustment creates audit log entry | Check `/api/admin/inventory/history` shows new entry | |

**Valid Reason Codes:**
- `received` — Stock from supplier
- `returned` — Customer return
- `damaged` — Write-off
- `lost` — Shrinkage
- `correction` — Count correction
- `transfer_in` / `transfer_out` — Warehouse transfer
- `reserved` / `released` — Order reservation
- `sold` — Sold to customer

---

## TC-3: Inventory History (Audit Log)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `GET /api/admin/inventory/history` | Returns paginated list of all adjustments | |
| 3.2 | Filter by variantId: `?variantId={id}` | Only shows adjustments for that variant | |
| 3.3 | Filter by reason: `?reason=damaged` | Only shows "damaged" adjustments | |
| 3.4 | Filter by date range: `?startDate=2026-01-01&endDate=2026-06-30` | Only shows adjustments in range | |
| 3.5 | Pagination: `?page=2&limit=10` | Returns correct page with pagination metadata | |
| 3.6 | Each adjustment shows: variant details, product name, type, quantity, previous/new qty, reason, actor, timestamp | All fields present | |

---

## TC-4: Warehouse Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `GET /api/admin/inventory/warehouses` | Returns list of all warehouses | |
| 4.2 | `POST /api/admin/inventory/warehouses` with `{ name: "Chennai Main", code: "WH-CHN", city: "Chennai" }` | Creates warehouse, returns 201 | |
| 4.3 | Create second warehouse: `{ name: "Mumbai Hub", code: "WH-MUM", city: "Mumbai" }` | Created successfully | |
| 4.4 | Try duplicate code: `{ name: "Test", code: "WH-CHN" }` | Returns 400 "already exists" | |
| 4.5 | Create with `isDefault: true` | Other warehouses lose default flag | |
| 4.6 | Missing name/code | Returns 400 "required" | |

---

## TC-5: Stock Transfers (Between Warehouses)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `GET /api/admin/inventory/transfers` | Returns list of all transfers (initially empty) | |
| 5.2 | `POST /api/admin/inventory/transfers` with valid data | Creates transfer with status "pending", returns 201 | |
| 5.3 | Verify transfer has: transferNumber, source/destination warehouses, items | All fields present | |
| 5.4 | Filter by status: `?status=pending` | Only shows pending transfers | |
| 5.5 | Try same source and destination warehouse | Returns 400 "must be different" | |
| 5.6 | Try quantity exceeding source stock | Returns 400 "Insufficient stock" | |
| 5.7 | Try non-existent warehouse | Returns 404 | |
| 5.8 | Try missing required fields | Returns 400 | |

---

## TC-6: Inventory Forecasting

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | `GET /api/admin/inventory/forecast` | Returns forecast for all active variants | |
| 6.2 | Custom lookback: `?days=60` | Uses 60-day sales data | |
| 6.3 | Custom lead time: `?leadTime=14` | Affects reorder point calculation | |
| 6.4 | Verify each forecast has: variantId, productName, currentStock, avgDailySales, daysOfStockRemaining, suggestedReorderQuantity, reorderPoint, status | All fields present | |
| 6.5 | Verify summary: total, critical, low, adequate, overstocked counts | Counts match forecast list | |
| 6.6 | Variants with 0 stock show status "critical" | Correct | |
| 6.7 | Variants below reorder point show "low" | Correct | |
| 6.8 | Well-stocked variants show "adequate" or "overstocked" | Correct | |

---

## TC-7: Stock Reservation API

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 7.1 | `POST /api/admin/inventory/reserve` with `{ variantId, quantity: 5, orderId: "ORD-123" }` | Stock decremented by 5, returns success | |
| 7.2 | Verify `previousStock` and `newStock` in response | Correct values | |
| 7.3 | Reserve more than available | Returns 400 "Insufficient stock" | |
| 7.4 | Reserve with missing fields | Returns 400 | |
| 7.5 | `DELETE /api/admin/inventory/reserve` with `{ variantId, quantity: 5, orderId: "ORD-123" }` | Stock incremented by 5, returns success | |
| 7.6 | Verify stock restored after release | newStock = previousStock + quantity | |
| 7.7 | Both reserve and release create StockAdjustment records | Check history API | |

---

## TC-8: Replenish Scan (Existing Feature)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 8.1 | Click "Run Auto-Replenish Check" on inventory page | Scan completes, shows results | |
| 8.2 | Or call `POST /api/admin/inventory/replenish` | Returns `{ checkedAt, totalVariants, lowStockVariants[] }` | |
| 8.3 | Low stock variants listed with: productName, colorName, size, stock, threshold, status | All info correct | |
| 8.4 | Status is "out" for 0 stock, "low" for below threshold | Correct classification | |

---

## TC-9: Batch/Lot Tracking (Schema Ready)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 9.1 | Verify `batch_lots` table exists after migration | Table created | |
| 9.2 | Fields include: batchNumber (unique), variantId, warehouseId, quantity, costPrice, supplier, manufacturedAt, expiryDate, receivedAt | All columns present | |
| 9.3 | Batch number generation: call test from code `generateBatchNumber()` | Returns format `LOT-YYYYMMDD-XXXX` | |
| 9.4 | Expiry check utility: `isExpired(pastDate)` → true | Correct | |
| 9.5 | Days until expiry: `daysUntilExpiry(futureDate)` → positive number | Correct | |

---

## TC-10: Stock Level Alerts

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 10.1 | Set a variant stock to 0 | Product shows "Void" badge on inventory page | |
| 10.2 | Set stock to value ≤ lowStockThreshold | Product shows "Low" badge | |
| 10.3 | Set stock above threshold | Product shows "Optimal" badge | |
| 10.4 | Forecast API identifies critical/low variants | Status field reflects actual stock state | |

---

## TC-11: Concurrent Stock Operations

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 11.1 | Send two simultaneous reserve requests for same variant (total > stock) | One succeeds, one fails with "Insufficient stock" | |
| 11.2 | Send increment + decrement simultaneously | Both operations complete without data corruption | |
| 11.3 | Check final stock matches expected value | Consistent state after concurrent ops | |

---

## Automated Test Results

Run Phase 2 unit + integration tests:

```bash
npx vitest run __tests__/lib/inventory.test.ts __tests__/api/admin-inventory.test.ts
```

Run E2E smoke tests (requires dev server):

```bash
npx playwright test e2e/inventory-management.spec.ts
```

**Expected:** All 64 tests pass.

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/inventory.test.ts | Unit | 33 | ✅ All pass |
| api/admin-inventory.test.ts | Integration | 20 | ✅ All pass |
| e2e/inventory-management.spec.ts | E2E (Playwright) | 11 | ✅ All pass |
| **TOTAL** | **All types** | **64** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/inventory/adjust` | Adjust stock with reason code |
| GET | `/api/admin/inventory/history` | Paginated adjustment history |
| GET | `/api/admin/inventory/warehouses` | List all warehouses |
| POST | `/api/admin/inventory/warehouses` | Create a warehouse |
| GET | `/api/admin/inventory/transfers` | List stock transfers |
| POST | `/api/admin/inventory/transfers` | Create a transfer |
| GET | `/api/admin/inventory/forecast` | Demand forecast |
| POST | `/api/admin/inventory/reserve` | Reserve stock for order |
| DELETE | `/api/admin/inventory/reserve` | Release reserved stock |
| POST | `/api/admin/inventory/replenish` | Run low-stock scan |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |

---

## Notes

1. **Multi-warehouse** — Schema and APIs are complete. Stock can be tracked per-warehouse via `WarehouseStock` model. The main `ProductVariant.stock` field remains the source of truth for storefront availability.
2. **Batch/Lot tracking** — Schema is ready with `BatchLot` model. CRUD API can be added when supplier integration is active.
3. **Transfer workflow** — Transfers are created as "pending" and can progress through "in_transit" → "received" or be "cancelled".
4. **Forecasting** — Uses simple moving average over configurable lookback period. More sophisticated ML-based forecasting is a Phase 13 item.
5. **Concurrent reservations** — Prisma transactions with atomic increment/decrement handle race conditions at the database level.
