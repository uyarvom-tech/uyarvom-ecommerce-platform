# Phase 3: Order Management System (OMS) — UAT Manual Testing Guide

> **Version:** 1.0
> **Date:** June 2026
> **Objective:** Validate all OMS features work correctly.
> **Prerequisites:** Dev server running, admin access, products with stock available, at least one test customer account.

---

## TC-1: Order Lifecycle (State Machine)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | Create order via checkout (customer) | Order created with status "pending" | |
| 1.2 | Admin: transition pending → confirmed | Status updates, OrderEvent logged | |
| 1.3 | Admin: transition confirmed → processing | Status updates | |
| 1.4 | Admin: transition processing → shipped (with tracking) | Status updates, shippedAt set, tracking saved | |
| 1.5 | Admin: transition shipped → delivered | Status updates, deliveredAt set | |
| 1.6 | Try delivered → pending | Error: "Cannot transition" | |
| 1.7 | Try shipped → cancelled | Error: "Cannot transition" | |
| 1.8 | pending → cancelled | Stock restored, cancelledAt set | |

---

## TC-2: Fulfillment API

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `POST /api/admin/orders/{id}/fulfill` with `{ status: "confirmed" }` | Returns 200 with previousStatus and newStatus | |
| 2.2 | Include trackingNumber + courierName when shipping | Values saved to order | |
| 2.3 | Fulfillment creates OrderEvent | Timeline shows new event | |
| 2.4 | Cancel via fulfillment API | Stock restored for all items | |
| 2.5 | Non-existent order | Returns 404 | |
| 2.6 | Invalid transition | Returns 400 with error message | |

---

## TC-3: Manual Order Creation (Admin)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `POST /api/admin/orders` with userId, items, shippingAddress | Order created with status "confirmed", returns 201 | |
| 3.2 | Verify stock decremented for each item | Variant stock reduced | |
| 3.3 | Verify OrderEvent "Manual Order Created" logged | Event visible in timeline | |
| 3.4 | Tax calculated at 18% GST | Correct tax amount | |
| 3.5 | Free shipping for orders ≥ ₹999 | Shipping = 0 | |
| 3.6 | Missing required fields | Returns 400 | |
| 3.7 | Non-existent user | Returns 404 | |
| 3.8 | Non-existent variant | Returns 404 | |

---

## TC-4: Bulk Order Processing

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `POST /api/admin/orders/bulk` with `{ orderIds: [...], status: "processing" }` | All eligible orders updated | |
| 4.2 | Mix of valid and invalid transitions | Returns per-order success/failure results | |
| 4.3 | Max 100 orders per batch | Over 100 returns 400 | |
| 4.4 | Empty orderIds array | Returns 400 | |
| 4.5 | Bulk cancel → stock restored for each order | Variant stock incremented | |
| 4.6 | Response includes: processed, succeeded, failed, results[] | All fields present | |

---

## TC-5: Advanced Order Search/Filter API

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `GET /api/admin/orders` | Returns paginated orders list | |
| 5.2 | Filter by status: `?status=shipped` | Only shipped orders | |
| 5.3 | Filter by payment: `?paymentStatus=paid` | Only paid orders | |
| 5.4 | Search by order number: `?search=ORD-` | Matching orders returned | |
| 5.5 | Search by customer name/email | Matching orders | |
| 5.6 | Date range: `?startDate=2026-01-01&endDate=2026-06-30` | Orders within range | |
| 5.7 | Sort: `?sort=total-high` | Highest total first | |
| 5.8 | Pagination: `?page=2&limit=5` | Correct page with metadata | |

---

## TC-6: Split Shipments (Partial Fulfillment)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | Order with multiple items, ship only some | fulfillmentStatus becomes "partially_fulfilled" | |
| 6.2 | Ship remaining items | fulfillmentStatus becomes "fulfilled" | |
| 6.3 | Try to ship more than remaining quantity | Error returned | |
| 6.4 | Validate with `validateSplitShipment()` | Returns valid/invalid correctly | |

> **Note:** Split shipment logic is in `lib/orders.ts`. Full API integration for partial fulfillment tracking can be extended when courier integrations are active.

---

## TC-7: Backorder Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 7.1 | Call `identifyBackorders()` with items exceeding stock | Returns backorder items with quantities | |
| 7.2 | Items with sufficient stock → no backorder | Empty array returned | |
| 7.3 | Backorder quantity = requested - available | Math is correct | |

---

## TC-8: Exchange Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 8.1 | `canExchange('delivered', recentDate)` | Returns eligible: true | |
| 8.2 | `canExchange('shipped', date)` | Returns eligible: false (not delivered) | |
| 8.3 | `canExchange('delivered', oldDate)` | Returns eligible: false (window expired) | |
| 8.4 | All exchange reasons defined | wrong_size, wrong_color, defective, changed_mind, other | |

---

## TC-9: Order Confirmation Email

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 9.1 | Call `generateOrderConfirmationEmail()` with order data | Returns { subject, html } | |
| 9.2 | HTML contains: order number, customer name, items, totals, address | All data present | |
| 9.3 | COD shows "Cash on Delivery" | Correct payment method display | |
| 9.4 | Call `generateShippingEmail()` with tracking | HTML includes tracking number and courier | |

> **Note:** Email sending infrastructure (SMTP/API) is a Phase 11 integration item. Templates are ready to use with any provider.

---

## TC-10: Order Cancellation & Stock Restore

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 10.1 | Customer cancels pending order | Status → cancelled, stock restored | |
| 10.2 | Verify each item's variant stock is incremented | Stock = previous + quantity | |
| 10.3 | OrderEvent "Order Cancelled" logged | Event in timeline | |
| 10.4 | Cannot cancel shipped order | Error message | |
| 10.5 | Admin cancels via fulfill API | Same stock restore behavior | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/orders.test.ts __tests__/api/admin-orders.test.ts
npx playwright test e2e/order-management.spec.ts
```

**Expected:** All 66 tests pass.

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/orders.test.ts | Unit | 38 | ✅ All pass |
| api/admin-orders.test.ts | Integration | 20 | ✅ All pass |
| e2e/order-management.spec.ts | E2E (Playwright) | 8 | ✅ All pass |
| **TOTAL** | **All types** | **66** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | Advanced search/filter with pagination |
| POST | `/api/admin/orders` | Manual order creation (admin) |
| POST | `/api/admin/orders/[id]/fulfill` | Fulfillment with state machine validation |
| POST | `/api/admin/orders/bulk` | Bulk status update (up to 100 orders) |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
