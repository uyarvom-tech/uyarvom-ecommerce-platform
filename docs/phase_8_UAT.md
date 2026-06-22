# Phase 8: Shipping & Logistics — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied, orders with items.

---

## TC-1: Carrier Configuration

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `POST /api/admin/shipping/carriers` with `{ name: "Delhivery", code: "delhivery", baseRate: 40 }` | Carrier created, returns 201 | |
| 1.2 | `GET /api/admin/shipping/carriers` | Lists all configured carriers | |
| 1.3 | Duplicate code → 400 | Error | |
| 1.4 | Default carriers available: Delhivery, Blue Dart, DTDC, FedEx | In DEFAULT_CARRIERS constant | |

---

## TC-2: Rate Calculation & Comparison

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `GET /api/admin/shipping/rates?weight=1000&destState=Tamil Nadu` | Returns rates from all carriers | |
| 2.2 | Rates sorted by cheapest first | Ascending totalCharge | |
| 2.3 | Same state = regional zone | Correct zone detection | |
| 2.4 | Different state = national zone | Higher rates + longer days | |
| 2.5 | COD filter: `?cod=true` | FedEx marked unavailable (no COD) | |
| 2.6 | Weight 50g → below minimum | Carriers marked unavailable | |
| 2.7 | Weight 50kg → above max for most | Only FedEx available | |
| 2.8 | Each rate shows: baseCharge, weightCharge, codCharge, totalCharge, estimatedDays | All present | |

---

## TC-3: Shipment Creation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `POST /api/admin/shipping/shipments` with orderId + carrierCode | Shipment created with AWB, returns 201 | |
| 3.2 | AWB format: `{PREFIX}{11 digits}` (e.g., DEL12345678901) | Correct | |
| 3.3 | Order updated with trackingNumber and courierName | Verified in order detail | |
| 3.4 | Initial tracking event "Shipment created" logged | Present in trackingEvents | |
| 3.5 | `GET /api/admin/shipping/shipments` | Lists shipments with carrier info | |
| 3.6 | Filter by status: `?status=in_transit` | Filtered correctly | |
| 3.7 | Missing orderId → 400 | Validation error | |
| 3.8 | Non-existent carrier → 404 | Error | |

---

## TC-4: Tracking Webhook

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `POST /api/admin/shipping/webhook` with `{ awb, status: "picked_up", location: "Chennai" }` | Tracking event created, status updated | |
| 4.2 | Forward transitions allowed (created → picked_up → in_transit → delivered) | Each succeeds | |
| 4.3 | Backward transition rejected | Error: "Invalid status transition" | |
| 4.4 | Status "delivered" → order status auto-updated to delivered | Order.deliveredAt set | |
| 4.5 | Non-existent AWB → 404 | Error | |
| 4.6 | Transition to "failed" allowed from any state | Succeeds | |

---

## TC-5: Delivery Slots

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `generateDeliverySlots(7)` → 21 slots (3 per day × 7 days) | Correct count | |
| 5.2 | Each slot: date, timeStart, timeEnd, available, maxOrders | All fields present | |
| 5.3 | Morning (09-12), Afternoon (14-17), Evening (18-21) | Correct time windows | |
| 5.4 | All dates are future (after today) | Verified | |

---

## TC-6: NDR (Non-Delivery Report)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | NDR reasons defined: customer_unavailable, wrong_address, refused, damaged, other | All present | |
| 6.2 | Failed shipment can have ndrReason set | Data saved | |
| 6.3 | NDR actions: reattempt, return_to_origin, update_address, cancel | Defined in types | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/shipping.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/shipping.test.ts | Unit | 27 | ✅ All pass |
| **TOTAL** | | **27** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/shipping/carriers` | List carriers |
| POST | `/api/admin/shipping/carriers` | Configure carrier |
| GET | `/api/admin/shipping/rates` | Compare rates (weight, zone, COD) |
| GET | `/api/admin/shipping/shipments` | List shipments |
| POST | `/api/admin/shipping/shipments` | Create shipment (generates AWB) |
| POST | `/api/admin/shipping/webhook` | Tracking update receiver |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
