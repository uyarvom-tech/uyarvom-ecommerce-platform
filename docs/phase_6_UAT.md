# Phase 6: Customer Management (CRM) — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied, customers with orders.

---

## TC-1: Customer Listing

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `GET /api/admin/customers` | Returns paginated customer list with order/review counts | |
| 1.2 | Search: `?search=john` | Filters by name, email, or phone | |
| 1.3 | Sort: `?sort=name` | Alphabetical order | |
| 1.4 | Pagination: `?page=2&limit=10` | Correct page | |

---

## TC-2: Customer Detail with Analytics

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `GET /api/admin/customers/{id}` | Returns full profile with orders, addresses, reviews, tickets | |
| 2.2 | Response includes `analytics.rfmScores` (recency, frequency, monetary 1-5) | Calculated correctly | |
| 2.3 | Response includes `analytics.segment` (champions/loyal/new/at_risk/dormant/lost) | Correct classification | |
| 2.4 | Response includes `analytics.clv` (avgOrderValue, purchaseFrequency, estimatedCLV) | Reasonable values | |
| 2.5 | Response includes `notes` array | Notes present | |
| 2.6 | Non-existent customer → 404 | Error returned | |

---

## TC-3: Customer Notes

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `POST /api/admin/customers/{id}/notes` with `{ type: "general", content: "VIP" }` | Note created, returns 201 | |
| 3.2 | Note types: general, support, order, feedback, internal | All accepted | |
| 3.3 | Empty content → 400 error | Validation error | |
| 3.4 | Notes appear in customer detail GET response | Listed in `notes` array | |

---

## TC-4: Loyalty Program

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `GET /api/admin/loyalty?userId={id}` | Returns/creates loyalty account | |
| 4.2 | `POST /api/admin/loyalty` with `{ userId, type: "earned", points: 100 }` | Points added, account updated | |
| 4.3 | Tier upgrades: 500→silver, 2000→gold, 5000→platinum | Tier changes on point award | |
| 4.4 | Redeem: `{ type: "redeemed", points: 50 }` | Current points decreased | |
| 4.5 | Insufficient points for redemption → 400 | Error with available balance | |
| 4.6 | Invalid type → 400 | Error message | |
| 4.7 | Points earned per ₹10 spent, multiplied by tier | bronze=1x, silver=1.25x, gold=1.5x, platinum=2x | |
| 4.8 | 10 points = ₹1 discount | Conversion rate correct | |

---

## TC-5: Customer Segmentation (RFM)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `GET /api/admin/segments` | Returns segment list with member counts | |
| 5.2 | `POST /api/admin/segments` | Runs RFM analysis on all customers, assigns segments | |
| 5.3 | Segments created: champions, loyal, potential, new, at_risk, dormant, lost | All present | |
| 5.4 | Each segment has member count | Counts accurate | |
| 5.5 | Response includes `segmentLabels` with colors and descriptions | Reference data present | |

---

## TC-6: Points Calculation Rules

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | ₹1000 order, bronze tier → 100 points | 1 pt per ₹10 | |
| 6.2 | ₹1000 order, silver tier → 125 points | 1.25x multiplier | |
| 6.3 | ₹1000 order, gold tier → 150 points | 1.5x multiplier | |
| 6.4 | ₹1000 order, platinum tier → 200 points | 2x multiplier | |
| 6.5 | ₹55 order → 5 points (floored) | No fractional points | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/crm.test.ts __tests__/api/admin-crm.test.ts
npx playwright test e2e/crm.spec.ts --timeout=15000
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/crm.test.ts | Unit | 27 | ✅ All pass |
| api/admin-crm.test.ts | Integration | 12 | ✅ All pass |
| e2e/crm.spec.ts | E2E (Playwright) | 7 | ✅ (requires running dev server) |
| **TOTAL** | **All types** | **46** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/customers` | List customers (search, sort, paginate) |
| GET | `/api/admin/customers/[id]` | Customer detail + RFM + CLV + notes |
| POST | `/api/admin/customers/[id]/notes` | Add customer note |
| GET | `/api/admin/loyalty?userId=` | Get loyalty account |
| POST | `/api/admin/loyalty` | Award/redeem/adjust points |
| GET | `/api/admin/segments` | List segments with counts |
| POST | `/api/admin/segments` | Run RFM segmentation |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
