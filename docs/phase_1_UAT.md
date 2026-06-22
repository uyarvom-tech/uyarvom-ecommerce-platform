# Phase 1: Product Information Management (PIM) — UAT Manual Testing Guide

> **Version:** 1.0
> **Date:** June 2026
> **Objective:** Validate all PIM features are working correctly in the live development environment.
> **Prerequisites:** Dev server running (`npm run dev`), admin account access, database seeded with sample data.

---

## Test Environment Setup

1. Start the dev server: `npm run dev` (runs on http://localhost:3001)
2. Log in as admin at `/auth/login`
3. Navigate to admin panel at `/admin`

---

## TC-1: Product Catalog - Viewing & Navigation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 1.1 | Navigate to `/admin/catalog` | Catalog page loads showing all root categories with product counts | |
| 1.2 | Click a root category (e.g., "Cookware") | Sub-categories are shown with their product counts | |
| 1.3 | Click a sub-category | Products under that sub-category are listed | |
| 1.4 | Verify product cards show: name, image, price, status badge | All info is visible and correct | |

---

## TC-2: Product Creation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 2.1 | Navigate to `/admin/products/new` | "Add New Product" form loads with all fields | |
| 2.2 | Enter product name: "Test Ceramic Mug" | Slug auto-generates: `test-ceramic-mug`, SKU auto-generates | |
| 2.3 | Fill in short description: "Handcrafted mug" | Field accepts text input | |
| 2.4 | Fill in full description (multi-line text) | Textarea accepts long text | |
| 2.5 | Set price: 499 | Price field accepts numeric value | |
| 2.6 | Set compare at price: 699 | Compare price field accepts value | |
| 2.7 | Select main category: "Cookware" | Sub-category dropdown populates with children | |
| 2.8 | Select sub-category: relevant option | Sub-category is selected | |
| 2.9 | Set weight: 0.3 | Weight field accepts decimal | |
| 2.10 | Leave "Active" checked, check "Featured" | Both checkboxes work | |
| 2.11 | Upload an image for the default color | Image uploads and shows preview thumbnail | |
| 2.12 | Click "Create Product" | Success toast appears, redirects to product list | |
| 2.13 | Verify product appears in catalog listing | New product is visible with correct info | |

---

## TC-3: Product Editing

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 3.1 | Navigate to any product's edit page | Edit form loads with all existing data populated | |
| 3.2 | Change the product name | Slug does NOT auto-change (preserves existing) | |
| 3.3 | Update the price | Field updates correctly | |
| 3.4 | Change category assignment | New category is selectable | |
| 3.5 | Toggle "Active" off | Checkbox unchecks | |
| 3.6 | Click "Update Product" | Success toast, product saves with changes | |
| 3.7 | Reload edit page | Changes are persisted (data reloads correctly) | |

---

## TC-4: Product Deletion

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 4.1 | As admin, navigate to a test product | Product detail/edit loads | |
| 4.2 | Delete the product (via API: `DELETE /api/admin/products/{id}`) | Returns 200 with success message | |
| 4.3 | Verify product no longer appears in listing | Product is gone from catalog | |
| 4.4 | As staff (non-admin), attempt to delete | Returns 403 (only admins can delete) | |

---

## TC-5: SKU Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 5.1 | Create a new product, observe auto-generated SKU | SKU follows pattern: `UYV-XXXXXX-NNN` | |
| 5.2 | Try to create another product with the same SKU | Error: "Product with this SKU already exists" | |
| 5.3 | Edit a product and change its SKU | SKU updates successfully | |
| 5.4 | Try to change SKU to one that already exists | Error returned, no duplicate allowed | |

---

## TC-6: Categories & Subcategories (Hierarchical)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 6.1 | Navigate to `/admin/catalog` | Root categories displayed in display order | |
| 6.2 | Verify parent categories show child count | Count is accurate | |
| 6.3 | Click into a parent category | Sub-categories are listed | |
| 6.4 | Create a new sub-category under a parent | Sub-category appears in hierarchy | |
| 6.5 | Assign a product to both parent and sub-category | Product appears in both when browsing catalog | |
| 6.6 | Verify primary category is displayed on product cards | Correct category shown as primary | |

---

## TC-7: Product Images

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 7.1 | On product edit, upload a single image | Image uploads, shows preview, marked as primary | |
| 7.2 | Upload multiple images (select 3-4 at once) | All upload successfully, first becomes primary | |
| 7.3 | Drag an image to reorder | Sort order updates, images reorder visually | |
| 7.4 | Click star on a non-primary image | That image becomes primary, old primary loses star | |
| 7.5 | Edit alt text on an image | Alt text saves and persists on reload | |
| 7.6 | Delete an image | Image is removed, remaining images reorder | |
| 7.7 | Try uploading a non-image file (e.g., .txt) | Error: "File must be an image" | |
| 7.8 | Try uploading a file > 10MB | Error: "File size must be less than 10MB" | |
| 7.9 | Verify images display on storefront product page | Correct images show in correct order | |

---

## TC-8: Product Variants (Colors & Sizes)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 8.1 | Create product with default (single color, single size) | Product has one "Default" color with one "Default" size variant | |
| 8.2 | Check "Add more colors" | Color section expands, allows adding multiple colors | |
| 8.3 | Add a second color (name: "Blue", code: #0000FF) | Second color section appears | |
| 8.4 | Upload images for each color separately | Images associate to correct color | |
| 8.5 | Check "Add more sizes" and enter: "S, M, L, XL" | Size grid appears for each color | |
| 8.6 | Set per-size stock and price override | Values save to form state | |
| 8.7 | Set per-size SKU | SKU field accepts input | |
| 8.8 | Uncheck "Active" on a specific size | Size variant is deactivated | |
| 8.9 | Save the product | All variant data persists in database | |
| 8.10 | On product detail page, verify Variant Stock Manager shows all colors/sizes | Correct stock per variant displayed | |
| 8.11 | Update individual variant stock from detail page | Stock saves, total updates | |

---

## TC-9: Pricing Management

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 9.1 | Set base price: 599 | Price saves correctly | |
| 9.2 | Set compare-at price: 799 | Compare price shows as strikethrough on storefront | |
| 9.3 | Set per-variant price override (e.g., XL costs more) | Variant price is used when that size is selected | |
| 9.4 | Leave variant price empty | Falls back to product base price | |
| 9.5 | Verify buying price (cost) field exists in import data | buyingPrice field is populated from Excel import | |

---

## TC-10: Bulk Product Import (Excel)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 10.1 | Prepare Excel file with columns: category, Sub Category, product_name, sku, target_price, buying_price, moq, short_description, long_description, image | File is ready | |
| 10.2 | Run `node scripts/import-products-from-excel.js` | Script runs without errors | |
| 10.3 | Check console output for summary | Shows products created/updated, images copied, missing images | |
| 10.4 | Verify new products appear in `/admin/catalog` | Products are present with correct categories | |
| 10.5 | Verify images are copied to `/public/uploads/catalog/` | Image files exist | |
| 10.6 | Run import again (same data) | Products are updated (not duplicated), count shows "updated" | |
| 10.7 | Import product with duplicate SKU | Existing product is updated in-place | |

---

## TC-11: Bulk Product Export

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 11.1 | Call `GET /api/admin/products/export` (browser or curl) | CSV file downloads with all products | |
| 11.2 | Open CSV in Excel/Google Sheets | All columns are present and properly formatted | |
| 11.3 | Verify CSV contains: SKU, Name, Price, Categories, Stock, Images, Created date | All data is accurate | |
| 11.4 | Call `GET /api/admin/products/export?status=active` | Only active products in export | |
| 11.5 | Call `GET /api/admin/products/export?format=json` | JSON response with products array | |
| 11.6 | Verify descriptions with commas are properly CSV-escaped | Quoted fields in CSV | |

---

## TC-12: Barcode / QR Code Generation

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 12.1 | Call `GET /api/admin/products/{id}/barcode` for a product with SKU | Returns JSON with ean13, barcodeSVG, qrCodeSVG | |
| 12.2 | Verify `ean13` is 13 digits starting with `890` | Valid EAN-13 format | |
| 12.3 | Verify `barcodeSVG` is valid SVG (paste into HTML) | Renders as a barcode image | |
| 12.4 | Verify `qrCodeSVG` is valid SVG | Renders as a QR-like pattern | |
| 12.5 | Call barcode API for a product without SKU | Returns 400 error: "Product has no SKU assigned" | |
| 12.6 | Call barcode API for non-existent product | Returns 404 error | |
| 12.7 | Same SKU always produces same EAN-13 | Consistent barcode generation | |

---

## TC-13: Product Search & Filters (Admin API)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 13.1 | `GET /api/admin/products?search=bowl` | Returns products matching "bowl" in name or SKU | |
| 13.2 | `GET /api/admin/products?category={categoryId}` | Returns only products in that category | |
| 13.3 | `GET /api/admin/products?status=active` | Returns only active products | |
| 13.4 | `GET /api/admin/products?status=inactive` | Returns only inactive products | |
| 13.5 | `GET /api/admin/products?page=2&limit=5` | Returns 5 products, pagination shows page 2 | |
| 13.6 | Verify pagination metadata: page, limit, total, pages | All values are correct | |

---

## TC-14: Product Slug Uniqueness

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 14.1 | Create product with name "Ceramic Bowl" | Slug becomes `ceramic-bowl` | |
| 14.2 | Create another product with same name | Error: "Product with this slug already exists" | |
| 14.3 | Manually set slug to an existing slug on edit | Error returned, slug remains unique | |

---

## TC-15: AI Image Generation (Gemini)

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 15.1 | Navigate to product edit page with < 4 images | "Generate Images" button is visible | |
| 15.2 | Click "Generate Images" (requires valid Gemini API key) | Loading state shows, images generate | |
| 15.3 | After generation, verify new images appear in product's image list | AI-generated images are saved with alt text | |
| 15.4 | Product with 4+ images already | Generate button is disabled or shows "max images reached" | |

> **Note:** This test requires a valid Gemini API key with quota. If API key is invalid/expired, you'll see "API key not valid" error — this is expected.

---

## TC-16: Data Validation & Error Handling

| # | Step | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| 16.1 | Submit product form with empty name | Validation error: required field | |
| 16.2 | Submit product form with empty price | Validation error: required field | |
| 16.3 | Submit product form without selecting categories | Error: "Both main category and sub-category must be selected" | |
| 16.4 | Submit product form without any color/images | Error: "At least one product option is required" | |
| 16.5 | Submit product form with no images on a color | Error: "Please upload at least one image for [colorName]" | |
| 16.6 | Enter negative price | Form should reject or API should return error | |

---

## Automated Test Results

Run all Phase 1 unit + integration tests:

```bash
npx vitest run __tests__/lib/barcode.test.ts __tests__/lib/variant-stock.test.ts __tests__/api/admin-products.test.ts __tests__/api/admin-products-export.test.ts
```

Run E2E smoke tests (requires dev server running):

```bash
npx playwright test e2e/product-management.spec.ts
```

**Expected:** All 70 tests pass.

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| lib/barcode.test.ts | Unit | 15 | ✅ All pass |
| lib/variant-stock.test.ts | Unit | 19 | ✅ All pass |
| api/admin-products.test.ts | Integration | 11 | ✅ All pass |
| api/admin-products-export.test.ts | Integration | 6 | ✅ All pass |
| e2e/product-management.spec.ts | E2E (Playwright) | 14 | ✅ All pass |
| **TOTAL** | **All types** | **70** | **✅ PASS** |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |

---

## Notes & Known Limitations

1. **Video upload** — Not yet supported; images only. Can be added as a future enhancement.
2. **Barcode printing** — API generates SVG; physical label printing integration is pending.
3. **AI Image Generation** — Requires valid Gemini API key with billing enabled (free tier has limits).
4. **Rich Text Editor** — Uses TipTap with bold, italic, headings, lists, blockquote, code, undo/redo.
5. **Media Library** — Available at `/admin/media` with grid/list view, search, and URL copy.
6. **Bulk Export** — Available at `/api/admin/products/export` (CSV default, JSON optional).
