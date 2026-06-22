# Phase 7: Finance & Accounting — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access, `npx prisma db push` applied, orders in database.

---

## TC-1: Invoice Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | `POST /api/admin/finance/invoices` with line items | Invoice created with calculated totals, returns 201 | |
| 1.2 | Invoice number format: `INV-YYMM-XXXX` | Correct | |
| 1.3 | Totals: subtotal, discount, taxableAmount, gstAmount, grandTotal | Math correct | |
| 1.4 | `GET /api/admin/finance/invoices` | Paginated list with filters | |
| 1.5 | Filter by type: `?type=sales` | Only sales invoices | |
| 1.6 | Filter by status: `?status=paid` | Only paid invoices | |

---

## TC-2: Payment Recording

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | `POST /api/admin/finance/payments` with invoiceId and amount | Payment recorded, invoice paidAmount updated | |
| 2.2 | Full payment → invoice status becomes "paid" | Correct | |
| 2.3 | Partial payment → status becomes "partially_paid" | Correct | |
| 2.4 | Payment without invoice (standalone) | Accepted | |
| 2.5 | Missing required fields → 400 | Validation error | |

---

## TC-3: Tax Calculation (GST)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | `GET /api/admin/finance/tax?amount=1000&rate=18` | Intra-state: CGST=90, SGST=90, total=180 | |
| 3.2 | `?amount=1000&rate=18&interstate=true` | IGST=180, CGST=0, SGST=0 | |
| 3.3 | `?rate=5` | 5% rate applied correctly | |
| 3.4 | Missing amount → 400 | Error | |

---

## TC-4: Financial Reports

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | `GET /api/admin/finance/reports?type=summary` | Returns totalRevenue, totalOrders, pendingInvoices | |
| 4.2 | `?type=pnl` | Returns P&L: revenue, COGS, gross profit, expenses, net profit | |
| 4.3 | `?type=pnl&startDate=2026-01-01&endDate=2026-06-30` | Filtered by date range | |
| 4.4 | `?type=gst` | Returns GST summary: taxable amount, total collected, effective rate | |
| 4.5 | Gross margin and net margin calculated as percentages | Correct math | |

---

## TC-5: Double-Entry Validation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | Balanced journal (debits = credits) → valid | Passes validation | |
| 5.2 | Unbalanced journal → invalid | Error: "Debits must equal Credits" | |
| 5.3 | Less than 2 lines → invalid | Error | |
| 5.4 | Line with both debit + credit → invalid | Error | |
| 5.5 | Negative amounts → invalid | Error | |

---

## TC-6: Balance Sheet & Reconciliation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | Assets = Liabilities + Equity → balanced | `validateBalanceSheet` returns true | |
| 6.2 | Imbalanced → shows difference amount | Returns false with difference | |
| 6.3 | Bank reconciliation with no unmatched items → reconciled | Correct | |
| 6.4 | Unmatched transactions → shows difference | Returns false with unmatched totals | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/finance.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/finance.test.ts | Unit | 26 | ✅ All pass |
| **TOTAL** | | **26** | **✅ PASS** |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/finance/invoices` | List invoices (type, status filter) |
| POST | `/api/admin/finance/invoices` | Create invoice with line items |
| POST | `/api/admin/finance/payments` | Record payment (updates invoice) |
| GET | `/api/admin/finance/reports` | P&L, GST, or summary report |
| GET | `/api/admin/finance/tax` | Standalone GST calculator |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
