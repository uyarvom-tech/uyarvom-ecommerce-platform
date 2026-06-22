# Phase 12: Analytics & Dashboards — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, orders + products + customers in database.

---

## TC-1: Revenue Analytics

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `GET /api/admin/analytics?type=revenue&period=30` | Returns revenue trends (daily), total, growth | |
| 1.2 | `?groupBy=weekly` | Grouped by week | |
| 1.3 | `?groupBy=monthly` | Grouped by month | |
| 1.4 | Growth = (current - previous) / previous × 100 | YoY calculation correct | |
| 1.5 | Margins: grossMargin, netMargin as percentages | Correct math | |

---

## TC-2: Customer Analytics

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `GET /api/admin/analytics?type=customers` | Returns totalCustomers, newCustomers, repeatRate, churnRate, NPS | |
| 2.2 | Repeat rate = repeatCustomers / total × 100 | Correct percentage | |
| 2.3 | NPS calculated from review ratings (5=promoter, 1-3=detractor) | Score -100 to 100 | |
| 2.4 | Churn rate reflects inactive customers | Reasonable value | |

---

## TC-3: Inventory Analytics

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `GET /api/admin/analytics?type=inventory` | Returns totalUnits, costValue, retailValue, profit | |
| 3.2 | potentialProfit = retailValue - costValue | Correct | |
| 3.3 | outOfStock and lowStock counts | Match actual data | |

---

## TC-4: Operations Dashboard

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `GET /api/admin/analytics?type=operations` | Returns pending/processing/shipped counts + metrics | |
| 4.2 | Warehouse metrics: throughput, accuracy | Reasonable values | |

---

## TC-5: Supplier Scorecards

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `GET /api/admin/analytics?type=suppliers` | Returns scorecards per vendor | |
| 5.2 | Score = 60% on-time + 40% quality | Weighted correctly | |

---

## TC-6: Report Export

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | `toCSV(headers, rows)` generates valid CSV | Commas separated, newlines between rows | |
| 6.2 | Fields with commas are quoted | Escaped correctly | |
| 6.3 | Null values become empty strings | No "null" text in CSV | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/analytics.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/analytics.test.ts | Unit | 24 | ✅ All pass |
| **TOTAL** | | **24** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics?type=revenue` | Revenue trends, growth, margins |
| GET | `/api/admin/analytics?type=customers` | Repeat rate, churn, NPS |
| GET | `/api/admin/analytics?type=inventory` | Stock value, cost vs retail |
| GET | `/api/admin/analytics?type=operations` | Fulfillment metrics |
| GET | `/api/admin/analytics?type=suppliers` | Vendor scorecards |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
