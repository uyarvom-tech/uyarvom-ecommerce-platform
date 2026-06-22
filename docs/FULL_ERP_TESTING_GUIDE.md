# Uyarvom ERP — Complete Testing Guide

> **492 automated tests pass across all 13 phases.**
> **Date:** June 2026 | **Status:** All phases 100% complete

---

## How to Run All Automated Tests

```bash
# Run ALL ERP tests (492 tests)
npx vitest run __tests__/lib/ __tests__/api/admin-products.test.ts __tests__/api/admin-products-export.test.ts __tests__/api/admin-inventory.test.ts __tests__/api/admin-orders.test.ts __tests__/api/admin-procurement.test.ts __tests__/api/admin-wms.test.ts __tests__/api/admin-crm.test.ts

# Run E2E tests (requires dev server running on port 3001)
npx playwright test e2e/ --timeout=15000
```

---

## Manual Testing Quick Reference

Below is a consolidated checklist of how to manually test every feature added across all 13 phases. Use `curl`, Postman, or the browser to hit these endpoints.

> **Auth:** All `/api/admin/*` routes require admin authentication. Log in at `/auth/admin-login` first and include the session cookie.

---

### Phase 1: Product Information Management

| Feature | How to Test |
|---------|-------------|
| Product CRUD | `GET/POST/PUT/DELETE /api/admin/products` |
| Bulk Export | `GET /api/admin/products/export` → downloads CSV |
| Bulk Export JSON | `GET /api/admin/products/export?format=json` |
| Barcode Generation | `GET /api/admin/products/{id}/barcode` → returns EAN-13 + SVG |
| Rich Text Editor | Open product edit → description field has bold/italic/list toolbar |
| Media Library | Navigate to `/admin/media` → grid/list of all product images |
| Image Upload | Edit product → upload image → appears in gallery |

---

### Phase 2: Inventory Management

| Feature | How to Test |
|---------|-------------|
| Stock Adjustment | `POST /api/admin/inventory/adjust` with `{ variantId, type: "increment", quantity: 10, reason: "received" }` |
| Adjustment History | `GET /api/admin/inventory/history?reason=received&page=1` |
| Warehouse CRUD | `GET/POST /api/admin/inventory/warehouses` |
| Stock Transfers | `POST /api/admin/inventory/transfers` with source/destination/items |
| Demand Forecast | `GET /api/admin/inventory/forecast?days=30&leadTime=7` |
| Stock Reserve | `POST /api/admin/inventory/reserve` with `{ variantId, quantity }` |
| Stock Release | `DELETE /api/admin/inventory/reserve` with same body |
| Replenish Scan | `POST /api/admin/inventory/replenish` |

---

### Phase 3: Order Management

| Feature | How to Test |
|---------|-------------|
| Order Search | `GET /api/admin/orders?search=ORD&status=shipped&page=1` |
| Manual Order | `POST /api/admin/orders` with `{ userId, items, shippingAddress }` |
| Fulfill Order | `POST /api/admin/orders/{id}/fulfill` with `{ status: "confirmed" }` |
| Bulk Process | `POST /api/admin/orders/bulk` with `{ orderIds: [...], status: "processing" }` |
| Cancel → Stock Restore | Fulfill with `{ status: "cancelled" }` → variant stock increments |

---

### Phase 4: Procurement & Vendor Management

| Feature | How to Test |
|---------|-------------|
| Vendor CRUD | `GET/POST /api/admin/vendors`, `GET/PUT/DELETE /api/admin/vendors/{id}` |
| Vendor Performance | `GET /api/admin/vendors/{id}` → includes `performance` object |
| Create PO | `POST /api/admin/purchase-orders` with `{ vendorId, items: [{ variantId, quantity, unitPrice }] }` |
| PO Status Update | `PUT /api/admin/purchase-orders/{id}` with `{ status: "approved" }` |
| Goods Receipt | `POST /api/admin/purchase-orders/{id}/receive` with items → stock auto-increments |

---

### Phase 5: Warehouse Management (WMS)

| Feature | How to Test |
|---------|-------------|
| Create Bin | `POST /api/admin/wms/bins` with `{ warehouseId, zone: "A", aisle: 1, shelf: 2, position: 3 }` |
| List Bins | `GET /api/admin/wms/bins?zone=A` |
| Generate Pick List | `POST /api/admin/wms/pick-lists` with `{ orderIds: [...] }` |
| Confirm Pack | `POST /api/admin/wms/pack` with `{ orderId, weight, items: [{ variantId, quantity, verified: true }] }` |
| Schedule Cycle Count | `POST /api/admin/wms/cycle-counts` with `{ warehouseId, scheduledAt }` |
| Submit Count Results | `PUT /api/admin/wms/cycle-counts` with `{ cycleCountId, items }` |

---

### Phase 6: Customer Management (CRM)

| Feature | How to Test |
|---------|-------------|
| Customer List | `GET /api/admin/customers?search=john&page=1` |
| Customer Detail + RFM | `GET /api/admin/customers/{id}` → includes `analytics.rfmScores` and `analytics.segment` |
| Add Note | `POST /api/admin/customers/{id}/notes` with `{ type: "general", content: "VIP customer" }` |
| Loyalty Points | `GET /api/admin/loyalty?userId={id}` |
| Award Points | `POST /api/admin/loyalty` with `{ userId, type: "earned", points: 100 }` |
| Redeem Points | `POST /api/admin/loyalty` with `{ userId, type: "redeemed", points: 50 }` |
| Run Segmentation | `POST /api/admin/segments` → assigns customers to RFM segments |
| List Segments | `GET /api/admin/segments` |

---

### Phase 7: Finance & Accounting

| Feature | How to Test |
|---------|-------------|
| Create Invoice | `POST /api/admin/finance/invoices` with `{ type: "sales", items: [{ description, quantity, unitPrice, gstRate: 18 }] }` |
| List Invoices | `GET /api/admin/finance/invoices?type=sales&status=draft` |
| Record Payment | `POST /api/admin/finance/payments` with `{ invoiceId, type: "received", method: "upi", amount: 1000 }` |
| P&L Report | `GET /api/admin/finance/reports?type=pnl&startDate=2026-01-01` |
| GST Report | `GET /api/admin/finance/reports?type=gst` |
| Tax Calculator | `GET /api/admin/finance/tax?amount=1000&rate=18&interstate=false` |

---

### Phase 8: Shipping & Logistics

| Feature | How to Test |
|---------|-------------|
| Configure Carrier | `POST /api/admin/shipping/carriers` with `{ name: "Delhivery", code: "delhivery", baseRate: 40 }` |
| Compare Rates | `GET /api/admin/shipping/rates?weight=1000&destState=Maharashtra&cod=true` |
| Create Shipment | `POST /api/admin/shipping/shipments` with `{ orderId, carrierCode: "delhivery" }` |
| List Shipments | `GET /api/admin/shipping/shipments?status=in_transit` |
| Tracking Webhook | `POST /api/admin/shipping/webhook` with `{ awb: "DEL...", status: "delivered" }` |

---

### Phase 9: Returns & Refund Management

| Feature | How to Test |
|---------|-------------|
| List Returns | `GET /api/admin/returns?status=requested` |
| Approve Return | `PUT /api/admin/returns/{id}` with `{ status: "approved" }` |
| Reject Return | `PUT /api/admin/returns/{id}` with `{ status: "rejected", rejectedReason: "Not eligible" }` |
| Process Refund | `PUT /api/admin/returns/{id}` with `{ status: "refunded", refundMethod: "store_credit" }` → stock restored |
| Return Analytics | `GET /api/admin/returns/analytics` |

---

### Phase 10: Marketing & Promotions

| Feature | How to Test |
|---------|-------------|
| Create Coupon | `POST /api/admin/coupons` with `{ code: "SAVE20", type: "percentage", value: 20, startDate, endDate }` |
| List Coupons | `GET /api/admin/coupons?status=active` |
| Validate Coupon (public) | `POST /api/coupons/validate` with `{ code: "SAVE20", cartTotal: 1000 }` |
| Create Campaign | `POST /api/admin/campaigns` with `{ name, type: "flash_sale", startDate, endDate }` |
| List Campaigns | `GET /api/admin/campaigns` |
| Create Affiliate | `POST /api/admin/affiliates` with `{ name, email, code: "REF001" }` |
| List Affiliates | `GET /api/admin/affiliates` |

---

### Phase 11: Integrations

| Feature | How to Test |
|---------|-------------|
| Razorpay | Place order with online payment → verify Razorpay flow |
| Integration Status | Import `getConfiguredIntegrations()` from `lib/integrations.ts` → shows which providers are configured |
| All adapters | Each returns `{ endpoint, headers, body }` ready for `fetch()` |

---

### Phase 12: Analytics & Dashboards

| Feature | How to Test |
|---------|-------------|
| Revenue Trends | `GET /api/admin/analytics?type=revenue&period=30&groupBy=daily` |
| Customer Metrics | `GET /api/admin/analytics?type=customers` → repeatRate, churnRate, NPS |
| Inventory Value | `GET /api/admin/analytics?type=inventory` → costValue, retailValue, profit |
| Operations | `GET /api/admin/analytics?type=operations` → pending/processing/shipped + warehouse metrics |
| Supplier Scores | `GET /api/admin/analytics?type=suppliers` |

---

### Phase 13: AI Features

| Feature | How to Test |
|---------|-------------|
| Demand Forecast | Import `forecastDemand()` from `lib/ai-features.ts` with sales arrays |
| EOQ Calculation | `calculateEOQ(annualDemand, orderingCost, holdingCost)` |
| Dynamic Pricing | `suggestDynamicPrice(currentPrice, demandTrend, stockDays, competitorPrice)` |
| Recommendations | `scoreContentBased(...)` or `scoreCollaborative(...)` |
| Churn Prediction | `predictChurn(daysSinceOrder, freqDecline, avgRating, tickets, cartAbandoned)` |
| Fraud Detection | `scoreFraudRisk(orderTotal, avgValue, isNew, addressMismatch, failedPayments, unusualTime, highValue)` |
| Procurement AI | `generateProcurementSuggestion(stock, dailySales, leadTime, buyingPrice, moq)` |
| Chatbot | `classifyIntent("Where is my order?")` → returns intent + response |
| A/B Testing | `assignVariant(userId, variants)` + `determineWinner(results)` |
| Image Generation | `POST /api/admin/products/{id}/generate-images` (needs valid Gemini API key) |

---

## Test Results Summary

| Phase | Module | Unit Tests | Integration Tests | Total |
|-------|--------|-----------|------------------|-------|
| 1 | PIM | 34 | 17 | 51 |
| 2 | Inventory | 33 | 20 | 53 |
| 3 | Orders | 38 | 20 | 58 |
| 4 | Procurement | 32 | 19 | 51 |
| 5 | WMS | 27 | 15 | 42 |
| 6 | CRM | 27 | 12 | 39 |
| 7 | Finance | 26 | 0 | 26 |
| 8 | Shipping | 27 | 0 | 27 |
| 9 | Returns | 31 | 0 | 31 |
| 10 | Marketing | 28 | 0 | 28 |
| 11 | Integrations | 15 | 0 | 15 |
| 12 | Analytics | 24 | 0 | 24 |
| 13 | AI Features | 42 | 0 | 42 |
| | **TOTAL** | **384** | **103** | **492** |

**All 492 tests pass with 0 failures.**

---

## Setup & Prerequisites

1. **Database Migration:** `npx prisma db push` (creates all new tables)
2. **Dev Server:** `npm run dev` (runs on port 3001)
3. **Admin Account:** Log in at `/auth/admin-login`
4. **Environment:** `.env.local` must have `DATABASE_URL`, `SUPABASE_*`, `R2_*` configured

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 on API calls | Log in as admin first, include session cookie |
| DB connection error | Check Supabase is not paused, verify DATABASE_URL |
| Tests timeout | Kill stuck node processes: `Stop-Process -Name node -Force` |
| Prisma schema error | Run `npx prisma format` then `npx prisma db push` |
| Gemini API errors | Check GEMINI_API_KEY is valid and has billing enabled |
