# Phase 10: Marketing & Promotions — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied.

---

## TC-1: Coupon Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `POST /api/admin/coupons` with `{ code: "SAVE20", type: "percentage", value: 20, ... }` | Coupon created, returns 201 | |
| 1.2 | `GET /api/admin/coupons` | Lists all coupons | |
| 1.3 | Filter: `?status=active` | Only active, non-expired coupons | |
| 1.4 | Duplicate code → 400 | Error "already exists" | |
| 1.5 | Code auto-uppercased | "save20" → stored as "SAVE20" | |

---

## TC-2: Coupon Validation (Checkout)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `POST /api/coupons/validate` with `{ code: "SAVE20", cartTotal: 1000 }` | valid: true, discount calculated | |
| 2.2 | Percentage coupon capped at maxDiscount | 20% of ₹2000 = ₹400 → capped at maxDiscount | |
| 2.3 | Below minOrderAmount | valid: false, error shows minimum | |
| 2.4 | Expired coupon | valid: false, error "expired" | |
| 2.5 | Usage limit exhausted | valid: false, error "usage limit" | |
| 2.6 | Per-user limit reached | valid: false, error "maximum number" | |
| 2.7 | Invalid code | valid: false, error "Invalid coupon code" | |

---

## TC-3: Discount Rules & Stacking

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | Two stackable rules → both apply | Combined discount correct | |
| 3.2 | Non-stackable rule → only that one applies | No further discounts | |
| 3.3 | Rules sorted by priority (highest first) | Order correct | |
| 3.4 | Total discount never exceeds cart total | Capped | |

---

## TC-4: Campaign Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `POST /api/admin/campaigns` with dates | Campaign created with auto-computed status | |
| 4.2 | `GET /api/admin/campaigns` | Lists with computedStatus field | |
| 4.3 | Future dates → status "scheduled" | Correct | |
| 4.4 | Current dates → status "active" | Correct | |
| 4.5 | Past dates → status "completed" | Correct | |

---

## TC-5: Affiliate Program

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `POST /api/admin/affiliates` with `{ name, email, code }` | Affiliate created, returns 201 | |
| 5.2 | `GET /api/admin/affiliates` | Lists with referral counts | |
| 5.3 | Duplicate email/code → 400 | Error | |
| 5.4 | Commission: 5% of ₹2000 = ₹100 | calculateCommission correct | |
| 5.5 | Affiliate link: `{url}/products/{slug}?ref={code}` | Format correct | |

---

## TC-6: Cross-sell & Upsell

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | Same category + upsell → high score | > 80 | |
| 6.2 | Different category + cross_sell → moderate score | 50-70 | |
| 6.3 | frequently_bought_together → high bonus | +25 to score | |
| 6.4 | Score capped at 100 | Never exceeds | |

---

## TC-7: Abandoned Cart

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 7.1 | Cart inactive 2 hours → abandoned | isCartAbandoned = true | |
| 7.2 | Cart active 5 min ago → not abandoned | isCartAbandoned = false | |
| 7.3 | Sequence: 1h → reminder, 24h → discount, 72h → final | ABANDONED_CART_SEQUENCE correct | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/promotions.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/promotions.test.ts | Unit | 28 | ✅ All pass |
| **TOTAL** | | **28** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/coupons` | List coupons (status filter) |
| POST | `/api/admin/coupons` | Create coupon |
| POST | `/api/coupons/validate` | Validate coupon at checkout (public) |
| GET | `/api/admin/campaigns` | List campaigns |
| POST | `/api/admin/campaigns` | Create campaign |
| GET | `/api/admin/affiliates` | List affiliates |
| POST | `/api/admin/affiliates` | Create affiliate |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
