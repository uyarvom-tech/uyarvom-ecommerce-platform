# Phase 11: Integrations — UAT Manual Testing Guide

> **Version:** 1.0 | **Date:** June 2026
> **Prerequisites:** Dev server running, admin access. API keys needed for live testing (sandbox accounts recommended).

---

## TC-1: Payment Gateways

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | Razorpay: Place order with online payment | Razorpay order created, payment flow works | |
| 1.2 | Stripe: `createStripePaymentParams()` → correct endpoint/body | API structure matches Stripe docs | |
| 1.3 | PayPal: `createPayPalOrderParams()` → correct purchase_units | Amount in full units, customer name split | |
| 1.4 | Razorpay webhook verification works | Payment verified, order status updated | |

---

## TC-2: Shipping Provider APIs

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | Delhivery: `createDelhiveryShipmentParams()` → correct format | Includes receiver, weight, payment_mode | |
| 2.2 | Blue Dart: `createBlueDartShipmentParams()` → correct format | ConsigneeName, ProductCode (D/C) | |
| 2.3 | FedEx: `createFedExShipmentParams()` → correct format | Weight in KG, country code IN | |
| 2.4 | COD shipments set correct payment mode | Verified per carrier | |
| 2.5 | Prepaid shipments set correct mode | Verified per carrier | |

---

## TC-3: Marketplace Connectors

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | Amazon: `createAmazonProductFeedParams()` → correct structure | feedType, marketplaceIds, products array | |
| 3.2 | Flipkart: `createFlipkartListingParams()` → correct structure | sku_id, selling_price, listing_status | |
| 3.3 | Product sync includes: SKU, title, price, stock | All fields present | |

---

## TC-4: E-commerce Platform Connectors

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | Shopify: `createShopifyProductParams()` → correct admin API format | X-Shopify-Access-Token header, product JSON | |
| 4.2 | WooCommerce: `createWooCommerceProductParams()` → correct REST API format | Basic auth, manage_stock=true | |
| 4.3 | Both include: title, SKU, price, stock, images | All fields mapped | |

---

## TC-5: Integration Status Dashboard

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | `getConfiguredIntegrations()` returns status for 13 integrations | All providers listed | |
| 5.2 | Each has: provider name, configured boolean | Correct structure | |
| 5.3 | Configured = true when env vars are set | Checks actual env | |
| 5.4 | Providers: razorpay, stripe, paypal, delhivery, bluedart, fedex, amazon, flipkart, shopify, woocommerce, cloudflare_r2, supabase, gemini | All present | |

---

## Automated Test Results

```bash
npx vitest run __tests__/lib/integrations.test.ts
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/integrations.test.ts | Unit | 15 | ✅ All pass |
| **TOTAL** | | **15** | **✅ PASS** |

---

## Integration Configuration (.env.local)

```env
# Payment Gateways
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_ACCESS_TOKEN=...

# Shipping Providers
DELHIVERY_API_TOKEN=...
BLUEDART_API_KEY=...
FEDEX_API_TOKEN=...

# Marketplaces
AMAZON_SP_ACCESS_TOKEN=...
AMAZON_MARKETPLACE_ID=A21TJRUUN4KGV
FLIPKART_ACCESS_TOKEN=...

# E-commerce Platforms
SHOPIFY_SHOP_DOMAIN=store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...
WOOCOMMERCE_URL=https://store.example.com
WOOCOMMERCE_KEY=ck_...
WOOCOMMERCE_SECRET=cs_...
```

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
