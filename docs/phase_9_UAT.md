# Phase 9: Returns & Refund Management — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied, delivered orders.

---

## TC-1: Return Request Queue

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `GET /api/admin/returns` | Returns paginated list of all return requests | |
| 1.2 | Filter: `?status=requested` | Only pending returns | |
| 1.3 | Each return shows: returnNumber, orderId, status, reason, itemTotal | All present | |

---

## TC-2: Return Approval/Rejection

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `PUT /api/admin/returns/{id}` with `{ status: "approved" }` | Approved, approvedAt set | |
| 2.2 | `PUT` with `{ status: "rejected", rejectedReason: "Not eligible" }` | Rejected with reason | |
| 2.3 | Invalid transition (e.g., closed → approved) | Error 400 | |
| 2.4 | Non-existent return → 404 | Error | |

---

## TC-3: Refund Processing

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `PUT` with `{ status: "refunded", refundMethod: "original_payment" }` | Refund calculated, stock restored | |
| 3.2 | Seller-fault (defective) → shipping refunded | shippingRefund > 0 | |
| 3.3 | Changed mind → 5% restocking fee | deductions = 5% of itemTotal | |
| 3.4 | Store credit method → 10% bonus | storeCredit = netRefund × 1.1 | |
| 3.5 | Stock restored for returned items | variant.stock incremented | |
| 3.6 | Order returnStatus updated to "refunded" | Verified | |

---

## TC-4: Return Eligibility

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | Delivered 3 days ago, 7-day window | eligible: true, daysRemaining: 4 | |
| 4.2 | Delivered 10 days ago | eligible: false, reason: "expired" | |
| 4.3 | Non-delivered order | eligible: false | |
| 4.4 | Already returned | eligible: false, reason: "already requested" | |
| 4.5 | Custom window (14 days) | Respects custom setting | |

---

## TC-5: Replacement Orders

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | canReplace('defective', stock: 5) | eligible: true | |
| 5.2 | canReplace('wrong_size', stock: 3) | eligible: true | |
| 5.3 | canReplace('changed_mind', stock: 10) | eligible: false (not applicable) | |
| 5.4 | canReplace('defective', stock: 0) | eligible: false (out of stock) | |

---

## TC-6: Return Analytics

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | `GET /api/admin/returns/analytics` | Returns metrics | |
| 6.2 | returnRate = (totalReturns / totalOrders) × 100 | Correct percentage | |
| 6.3 | approvalRate calculated | Correct | |
| 6.4 | reasonBreakdown shows count per reason | All reasons counted | |
| 6.5 | totalRefunded sum of all refund amounts | Correct | |

---

## TC-7: Return Lifecycle

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 7.1 | requested → approved → pickup_scheduled → picked_up → received → inspected → refunded → closed | Full lifecycle works | |
| 7.2 | At each step, only valid next statuses are allowed | Invalid transitions rejected | |
| 7.3 | Inspection result (accepted/rejected/partial) recorded | Saved with notes | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/returns.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/returns.test.ts | Unit | 31 | ✅ All pass |
| **TOTAL** | | **31** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/returns` | List returns (status filter, pagination) |
| GET | `/api/admin/returns/[id]` | Return detail |
| PUT | `/api/admin/returns/[id]` | Update status (approve/reject/refund) |
| GET | `/api/admin/returns/analytics` | Return metrics & analytics |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
