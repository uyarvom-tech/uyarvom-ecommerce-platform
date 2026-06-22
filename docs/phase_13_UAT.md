# Phase 13: AI Features (Modern ERP) — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, orders/products/customers in database.

---

## TC-1: Demand Forecasting

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `forecastDemand([5,4,6,5,7], [3,3,2,4,3], 50)` | predictedDailySales > 3, trend = "rising" | |
| 1.2 | Declining sales → trend = "declining" | Detected correctly | |
| 1.3 | Stable sales → trend = "stable" | No false positives | |
| 1.4 | Seasonal multiplier applied | Predicted sales scaled | |
| 1.5 | Confidence increases with more data points | 30 days → confidence = 1.0 | |

---

## TC-2: Inventory Optimization (EOQ)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `calculateEOQ(1000, 500, 50)` → ~142 | Wilson formula correct | |
| 2.2 | Zero demand → EOQ = 0 | No division error | |
| 2.3 | Reorder urgency: 0 days → critical, 5 → soon, 15 → planned, 60 → ok | Correct | |

---

## TC-3: Dynamic Pricing

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | Rising demand + low stock → price increase (+10-20%) | suggestedPrice > current | |
| 3.2 | Declining demand + high stock → price decrease (-5-15%) | suggestedPrice < current | |
| 3.3 | Stable conditions → no change | changePercent = 0 | |
| 3.4 | Competitor influence: priced below → allow increase | Adjusted up | |
| 3.5 | Confidence higher for small changes | >0.9 for ≤5% | |

---

## TC-4: Product Recommendations

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | Same category → higher score | 40+ points from category match | |
| 4.2 | In price range → +30 points | Score reflects affinity | |
| 4.3 | Collaborative scoring from co-purchases | Higher co-purchase = higher score | |
| 4.4 | Score capped at 100 | Never exceeds | |

---

## TC-5: Customer Churn Prediction

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | Inactive 100+ days + declining frequency → high risk | churnProbability > 0.6 | |
| 5.2 | Active 5 days ago, good ratings → low risk | churnProbability < 0.3 | |
| 5.3 | High risk → "Send win-back offer" | Action suggestion | |
| 5.4 | Signals list populated | Explains why customer is at risk | |

---

## TC-6: Fraud Detection

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | New customer + high order + address mismatch + failed payments → block | riskScore ≥ 70 | |
| 6.2 | Normal order from returning customer → allow | riskScore < 30 | |
| 6.3 | Moderate signals → review | riskScore 30-70 | |
| 6.4 | Flags list explains each signal | Human-readable | |

---

## TC-7: Automated Procurement Suggestions

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 7.1 | Stock 10, sells 5/day, lead time 7 → urgency "immediate" | Stockout in 2 days < lead time | |
| 7.2 | Order qty respects MOQ multiples | suggestedOrderQty % MOQ = 0 | |
| 7.3 | Zero sales → urgency "next_month" | No unnecessary urgency | |
| 7.4 | estimatedCost = qty × buyingPrice | Correct | |

---

## TC-8: AI Chatbot Intent Classification

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 8.1 | "Where is my order?" → order_status | Correct intent, confidence > 0.7 | |
| 8.2 | "I want to return this" → return_request | Correct | |
| 8.3 | "How long does delivery take?" → shipping_info | Correct | |
| 8.4 | "Payment failed" → payment_issue, requiresHuman = true | Correct | |
| 8.5 | "This is terrible" → complaint, requiresHuman = true | Escalated | |
| 8.6 | "Hello" → general_query | Fallback works | |

---

## TC-9: A/B Testing Framework

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 9.1 | Same userId → same variant (deterministic) | Consistent assignment | |
| 9.2 | Different users spread across variants | Both variants get traffic | |
| 9.3 | Clear winner (5%+ better, 100+ impressions) → determined | Winner returned | |
| 9.4 | No clear winner → null | No premature decisions | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/ai-features.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/ai-features.test.ts | Unit | 42 | ✅ All pass |
| **TOTAL** | | **42** | **✅ PASS** |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
