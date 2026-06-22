# Uyarvom Ecommerce Platform - Testing Guide

This document describes the testing structure and how to run tests for the Uyarvom Ecommerce Platform.

## Test Modules

### Unit & Integration Tests (Vitest)
Located in `__tests__/`. These tests cover individual functions, server actions, and API routes.

| Module | Test File | Description |
|--------|-----------|-------------|
| `lib/auth-middleware.ts` | `__tests__/auth-middleware.test.ts` | Authentication and authorization logic. |
| `lib/actions/support.ts` | `__tests__/support.test.ts` | Customer support ticket creation and replies. |
| `lib/actions/admin-support.ts` | `__tests__/admin-support.test.ts` | Admin support actions (assigning, status updates). |
| `app/api/cart/route.ts` | `__tests__/api/cart.test.ts` | Shopping cart API endpoints. |
| `lib/actions/checkout.ts` | `__tests__/api/orders.test.ts` | Checkout and order creation logic. |
| `app/api/admin/products/route.ts` | `__tests__/api/admin/products.test.ts` | Admin product management API. |

### End-to-End Tests (Playwright)
Located in `e2e/`. These tests simulate real user interactions in the browser.

| Feature | Test File | Description |
|---------|-----------|-------------|
| Product Browsing & Cart | `e2e/customer-checkout.spec.ts` | Guest user flow from home to checkout redirect. |
| Admin Access | `e2e/admin-dashboard.spec.ts` | Verifies admin dashboard redirects and login layout. |
| Support Workflow | `e2e/support-admin.spec.ts` | Customer support ticket flow. |

## How to Run Tests

### Run Unit Tests
```bash
npm run test:unit
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run All Tests (Consolidated)
This will run both Vitest and Playwright tests and generate a summary log in `test.log`.
```bash
node scripts/run-all-tests.js
```
