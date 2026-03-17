# Uyarvom Ecommerce Platform — Testing Coverage Gaps & Manual Testing Guide

**Document Version:** 1.0.0
**Scope:** Automated test audit + complete manual QA checklist
**Reference:** SYSTEM_BLUEPRINT.md, Modules.md, all files under `__tests__/` and `e2e/`

---

# SECTION 1: TESTING COVERAGE GAPS

## 1.1 Coverage Status by Module

### Legend
- ✅ Fully Tested — all happy paths, failure paths, edge cases, and role checks covered
- ⚠️ Partially Tested — some cases covered, explicit gaps listed below
- ❌ Not Tested — zero automated coverage
- 🚫 Untestable — external dependency or environment limitation prevents automation

---

### Core Modules

| Module | File(s) | Status | Notes |
|---|---|---|---|
| auth-middleware | `__tests__/auth-middleware.test.ts` | ✅ | All 7 functions, all 4 roles, error paths covered |
| user-sync | `__tests__/user-sync.test.ts` | ✅ | All metadata fallbacks, missing email throw covered |
| settings | `__tests__/settings.test.ts` | ✅ | getSystemSetting + getSystemSettings, null/error paths covered |
| prisma-client | none | ⚠️ | Singleton instantiation not tested; covered implicitly via all other tests |
| supabase-client | none | ❌ | Browser-side Supabase client (`lib/supabase/client.ts`) has zero unit tests |
| supabase-server | none | ⚠️ | Mocked in all auth tests; actual cookie adapter logic not directly tested |
| supabase-proxy | none | ❌ | `lib/supabase/proxy.ts` has zero tests |
| supabase-resilience | none | 🚫 | Requires live Supabase connection to simulate timeout; cannot be unit tested deterministically |
| middleware | none | ❌ | `middleware.ts` (Next.js edge middleware) has zero tests — no route protection, redirect, or timeout logic tested |
| admin-auth | none | ❌ | `lib/admin-auth.ts` has zero tests |

---

### Feature Modules

| Module | File(s) | Status | Notes |
|---|---|---|---|
| support-tickets (customer) | `__tests__/support.test.ts` | ✅ | createTicket + replyToTicket, all roles, edge cases covered |
| admin-support | `__tests__/admin-support.test.ts` | ✅ | assignTicket + updateTicketStatus, all auth paths covered |
| cart | `__tests__/api/cart.test.ts` | ⚠️ | Missing: DELETE cart item, PUT (quantity update) endpoint, cart item with inactive variant's parent product |
| checkout | `__tests__/api/orders.test.ts` | ⚠️ | Missing: Razorpay payment init failure path (paymentInitFailed branch), notes field, shipping fee/tax calculation assertions |
| orders-actions | `__tests__/orders-actions.test.ts` | ✅ | requestCancellation + requestReturn, all status guards, 7-day window covered |
| admin-orders (updateOrderStatus) | none | ❌ | `lib/actions/admin.ts` — updateOrderStatus, processReturn, updateStock have zero tests |
| reviews | `__tests__/api/reviews.test.ts` | ✅ | POST + GET, verified purchase, duplicate, rating bounds, slug lookup covered |
| product-catalog (API) | `__tests__/api/products.test.ts` | ✅ | All sort/filter/pagination params, error paths covered |
| product-catalog (slug route) | none | ❌ | `GET /api/products/[slug]` has zero tests |
| product-catalog (search) | none | ❌ | `GET /api/products/search` has zero tests |
| product-catalog (suggestions) | none | ❌ | `GET /api/products/suggestions` has zero tests |
| category-hierarchy (admin) | `__tests__/api/admin/categories.test.ts` | ✅ | GET/POST/PUT, depth guard, circular ref, slug conflict covered |
| category-hierarchy (DELETE) | none | ❌ | `DELETE /api/admin/categories/[id]` has zero tests |
| admin-products (GET) | none | ❌ | `GET /api/admin/products` and `GET /api/admin/products/[id]` have zero tests |
| admin-products (bulk) | none | ❌ | `POST /api/admin/products/bulk` has zero tests |
| admin-products (search) | none | ❌ | `GET /api/admin/products/search` has zero tests |
| admin-staff | `__tests__/api/admin/staff.test.ts` | ⚠️ | Missing: DELETE staff member, GET staff with auth guard (current GET has no auth check in implementation) |
| merchandising | none | ❌ | `lib/actions/merchandising.ts` — updateSystemSetting, upsertHeroBanner, deleteHeroBanner have zero tests |
| inventory (updateStock) | none | ❌ | `lib/actions/admin.ts` — updateStock has zero tests |
| deletion-tickets | none | ❌ | `GET /api/admin/deletion-tickets` and `PUT /api/admin/deletion-tickets/[id]` have zero tests |
| wishlist | none | ❌ | No test file exists for wishlist add/remove/list |
| delivery-checker | none | ❌ | No test file exists |
| ai-kitchen-match | none | ❌ | Heuristic matching logic has zero tests |
| hero-banners | none | ❌ | Covered under merchandising — zero tests |
| audit-log | none | ❌ | AuditLog creation (in admin.ts) has zero direct tests |
| checkout-verify (Razorpay) | none | 🚫 | `POST /api/checkout/verify` requires live Razorpay webhook signature; cannot be unit tested without real keys |

---

### Infrastructure Modules

| Module | File(s) | Status | Notes |
|---|---|---|---|
| api/ping | `__tests__/api/health-ping.test.ts` | ✅ | Status, message, timestamp, env fields covered |
| api/health | `__tests__/api/health-ping.test.ts` | 🚫 | Route creates `new PrismaClient()` at module level — cannot be intercepted by vi.mock; covered by E2E only |
| razorpay-integration | none | 🚫 | Requires live Razorpay sandbox credentials |
| cloudflare-r2 | none | 🚫 | Requires live R2 bucket credentials |
| prisma-seed | none | 🚫 | Requires live DB; validated via `npm run db:seed` |
| next-config | none | ❌ | No tests for image domain config, redirect rules |
| upload (admin) | none | ❌ | `POST /api/admin/upload` and `POST /api/admin/upload/category` have zero tests |
| upload (public) | none | ❌ | `POST /api/upload` has zero tests |
| user-profile API | none | ❌ | `GET /api/user/profile` has zero tests |

---

### E2E Coverage

| Flow | File | Status | Notes |
|---|---|---|---|
| Guest add-to-cart → login redirect | `e2e/customer-checkout.spec.ts` | ✅ | Covered |
| Homepage product listing | `e2e/customer-checkout.spec.ts` | ✅ | Covered |
| Product detail page | `e2e/customer-checkout.spec.ts` | ✅ | Covered |
| Login page renders + error | `e2e/customer-checkout.spec.ts` | ✅ | Covered |
| Register page renders | `e2e/customer-checkout.spec.ts` | ✅ | Covered |
| Account page auth guard | `e2e/customer-checkout.spec.ts` | ✅ | Covered |
| Admin login page + error | `e2e/admin-dashboard.spec.ts` | ✅ | Covered |
| All admin routes auth guard | `e2e/admin-dashboard.spec.ts` | ✅ | Covered |
| API health + ping | `e2e/admin-dashboard.spec.ts` | ✅ | Covered |
| Support page public access | `e2e/support-admin.spec.ts` | ✅ | Covered |
| API auth guards (cart, reviews, admin) | `e2e/support-admin.spec.ts` | ✅ | Covered |
| Full authenticated checkout | none | ❌ | Requires seeded user + live DB session |
| Authenticated cart management | none | ❌ | Requires seeded user + live DB session |
| Admin product CRUD (browser) | none | ❌ | Requires admin session |
| Admin order status update (browser) | none | ❌ | Requires admin session + seeded order |
| Support ticket full flow (browser) | none | ❌ | Requires authenticated user + admin session |
| Razorpay payment modal | none | 🚫 | Requires live Razorpay sandbox |
| Return/refund UI flow | none | 🚫 | UI is work-in-progress per SYSTEM_BLUEPRINT.md |

---

## 1.2 Partial Coverage — Explicit Gaps

### Cart (`__tests__/api/cart.test.ts`)
- Missing: `DELETE /api/cart/[id]` — remove item from cart
- Missing: `PUT /api/cart/[id]` — direct quantity update endpoint
- Missing: Adding item when existing cart item quantity + new quantity exceeds stock (should cap, not error)
- Missing: Cart GET when Prisma throws an unexpected error (500 path)

### Checkout (`__tests__/api/orders.test.ts`)
- Missing: `paymentInitFailed` branch — order created but Razorpay init throws
- Missing: Shipping fee calculation assertion (subtotal below threshold should add fee)
- Missing: Tax calculation assertion (18% applied correctly)
- Missing: `notes` field passed through to order creation
- Missing: COD order revalidatePath calls verified

### Admin Staff (`__tests__/api/admin/staff.test.ts`)
- Missing: `DELETE /api/admin/staff/[id]` — remove staff member
- Missing: Auth guard on `GET /api/admin/staff` — current implementation has no auth check, which is a security gap
- Missing: Successful staff creation (happy path with mocked Supabase success + Prisma transaction)

### Admin Products (`__tests__/api/admin/products.test.ts`)
- Missing: `GET /api/admin/products` — list products with filters
- Missing: `GET /api/admin/products/[id]` — single product fetch
- Missing: `POST /api/admin/products` happy path (successful creation)
- Missing: Slug conflict on POST (400 response)
- Missing: SKU conflict on POST (400 response)

---

---

# SECTION 2: MANUAL END-TO-END TESTING GUIDE

> This guide is written for a human tester with zero prior context.
> Each flow includes: preconditions, step-by-step actions, expected result, and failure signals.
> Run tests against a locally running instance (`npm run dev`) or the staging URL.
> Admin credentials: `admin@uyarvom.com` / `admin123` (default seed).

---

## 2.1 Authentication Flow

---

### TEST-AUTH-01: Customer Registration

**Preconditions**
- App is running
- No existing account with the test email

**Steps**
1. Navigate to `/auth/register`
2. Enter a valid email (e.g. `testuser@example.com`)
3. Enter a password of at least 8 characters
4. Enter full name
5. Click the Register / Sign Up button

**Expected Result**
- User is redirected to `/account` or homepage
- A welcome message or account page is visible
- No error messages shown

**Failure Signals**
- Page stays on register with no feedback
- Error: "Email already in use" when email is new
- Redirect goes to a 404 or error page

---

### TEST-AUTH-02: Customer Login — Valid Credentials

**Preconditions**
- Registered account exists

**Steps**
1. Navigate to `/auth/login`
2. Enter registered email and correct password
3. Click Sign In

**Expected Result**
- Redirected to homepage or `/account`
- Header shows user name or account icon (not "Login")
- Cart state is preserved from previous session

**Failure Signals**
- Stays on login page with no error
- Redirected to login again immediately
- Header still shows "Login" after successful sign-in

---

### TEST-AUTH-03: Customer Login — Invalid Credentials

**Preconditions**
- None

**Steps**
1. Navigate to `/auth/login`
2. Enter `wrong@example.com` and `wrongpassword`
3. Click Sign In

**Expected Result**
- Stays on login page
- Error message visible: "Invalid credentials" or similar
- No redirect occurs

**Failure Signals**
- Page crashes or shows a 500 error
- User is logged in despite wrong credentials
- No error message shown at all

---

### TEST-AUTH-04: Customer Login — Empty Fields

**Preconditions**
- None

**Steps**
1. Navigate to `/auth/login`
2. Leave email and password blank
3. Click Sign In

**Expected Result**
- Form validation prevents submission
- Error messages shown on empty fields

**Failure Signals**
- Form submits with empty fields
- API call made with empty credentials

---

### TEST-AUTH-05: Customer Logout

**Preconditions**
- User is logged in

**Steps**
1. Click the account icon or user menu in the header
2. Click "Logout" or "Sign Out"

**Expected Result**
- User is redirected to homepage or `/auth/login`
- Header reverts to showing "Login" / guest state
- Navigating to `/account` redirects to login

**Failure Signals**
- User remains logged in after clicking logout
- Session cookie persists (verify in browser DevTools → Application → Cookies)
- `/account` still accessible after logout

---

### TEST-AUTH-06: Admin Login — Valid Credentials

**Preconditions**
- Admin account seeded in DB

**Steps**
1. Navigate to `/auth/admin-login`
2. Enter `admin@uyarvom.com` and `admin123`
3. Click Sign In

**Expected Result**
- Redirected to `/admin` dashboard
- Admin sidebar visible with navigation items
- No "Unauthorized" message

**Failure Signals**
- Redirected back to admin login
- Dashboard loads but shows empty/broken state
- 403 or 401 error page

---

### TEST-AUTH-07: Admin Login — Non-Admin Account

**Preconditions**
- A regular customer account exists

**Steps**
1. Navigate to `/auth/admin-login`
2. Enter customer email and password
3. Click Sign In

**Expected Result**
- Login fails or redirects back to admin login
- Error: "Unauthorized" or "Access denied"
- Admin dashboard is NOT accessible

**Failure Signals**
- Customer can access `/admin` routes
- No error shown — silent redirect to dashboard

---

### TEST-AUTH-08: Session Expiry Behavior

**Preconditions**
- User is logged in

**Steps**
1. Log in as a customer
2. Open browser DevTools → Application → Cookies
3. Delete the Supabase session cookie (`sb-*-auth-token`)
4. Navigate to `/account`

**Expected Result**
- Redirected to `/auth/login`
- No crash or 500 error

**Failure Signals**
- `/account` loads with broken/empty state instead of redirecting
- Console shows unhandled auth errors

---

## 2.2 Product Flow

---

### TEST-PROD-01: Browse Products on Homepage

**Preconditions**
- DB seeded with at least 1 active product

**Steps**
1. Navigate to `/`
2. Scroll down to the product listing section

**Expected Result**
- Product cards visible with image, name, and price
- Each card has a clickable link

**Failure Signals**
- "No products found" on a seeded DB
- Product images broken (404)
- Page crashes with a JS error

---

### TEST-PROD-02: Open Product Detail Page

**Preconditions**
- At least 1 active product in DB

**Steps**
1. From homepage, click any product card
2. Observe the product detail page

**Expected Result**
- URL changes to `/products/[slug]`
- Product name shown as H1 heading
- Price displayed
- "Add to Cart" button visible
- Product images load correctly

**Failure Signals**
- 404 page for a valid product
- Price shows as `₹0` or `NaN`
- Images broken or missing
- "Add to Cart" button missing

---

### TEST-PROD-03: Product with Color Variants

**Preconditions**
- A product with color variants exists in DB

**Steps**
1. Navigate to a product with color variants
2. Observe the variant selector
3. Click each color swatch

**Expected Result**
- Color swatches visible
- Clicking a swatch updates the displayed image gallery
- Price updates if variant has a different price
- Stock indicator updates per variant

**Failure Signals**
- Swatches visible but clicking does nothing
- Gallery does not update on variant selection
- All variants show same stock regardless of actual stock

---

### TEST-PROD-04: Invalid Product URL

**Preconditions**
- None

**Steps**
1. Navigate to `/products/this-product-does-not-exist`

**Expected Result**
- 404 page shown with a helpful message
- Navigation back to homepage available

**Failure Signals**
- 500 error page
- Blank white page
- App crashes

---

### TEST-PROD-05: Product Search

**Preconditions**
- DB seeded with products

**Steps**
1. Click the search icon/bar in the header
2. Type a product name (e.g. "pot")
3. Observe results

**Expected Result**
- Matching products appear in results
- Results update as you type (if live search)
- Clicking a result navigates to the product page

**Failure Signals**
- No results for a known product name
- Search crashes the page
- Results show inactive/deleted products

---

### TEST-PROD-06: Category Navigation

**Preconditions**
- Categories seeded in DB

**Steps**
1. Click a category in the navigation menu
2. Observe the filtered product listing

**Expected Result**
- Only products in that category are shown
- Category name shown as page heading
- URL reflects the category slug

**Failure Signals**
- All products shown regardless of category
- Empty page for a category with products
- URL does not change

---

## 2.3 Cart Flow

---

### TEST-CART-01: Add Product to Cart (Authenticated)

**Preconditions**
- User is logged in
- Product with stock > 0 exists

**Steps**
1. Navigate to a product detail page
2. Click "Add to Cart"

**Expected Result**
- Cart icon in header updates count
- Success toast or confirmation shown
- Item appears in cart (`/cart`)

**Failure Signals**
- Cart count does not update
- No feedback shown
- Item not in cart when navigating to `/cart`

---

### TEST-CART-02: Add Product to Cart (Guest)

**Preconditions**
- User is NOT logged in

**Steps**
1. Navigate to a product detail page
2. Click "Add to Cart"

**Expected Result**
- Redirected to `/auth/login`
- After login, user is returned to the product or cart

**Failure Signals**
- Item added to cart without authentication
- Redirect goes to homepage instead of login
- After login, cart is empty

---

### TEST-CART-03: Add Same Product Twice

**Preconditions**
- User is logged in
- Product with stock >= 2 exists

**Steps**
1. Add a product to cart
2. Navigate back to the same product
3. Click "Add to Cart" again

**Expected Result**
- Cart shows quantity = 2 for that item (not two separate rows)
- Cart total updates correctly

**Failure Signals**
- Two separate line items for the same product
- Quantity stays at 1
- Cart total does not update

---

### TEST-CART-04: Add Out-of-Stock Product

**Preconditions**
- A product with `stockQuantity = 0` exists

**Steps**
1. Navigate to the out-of-stock product
2. Observe the "Add to Cart" button

**Expected Result**
- "Add to Cart" button is disabled or replaced with "Out of Stock"
- Clicking (if possible) shows an error message

**Failure Signals**
- Out-of-stock product can be added to cart
- No visual indicator of stock status
- API returns 409 but UI shows success

---

### TEST-CART-05: Remove Item from Cart

**Preconditions**
- User is logged in with at least 1 item in cart

**Steps**
1. Navigate to `/cart`
2. Click the remove/delete button on a cart item

**Expected Result**
- Item removed from cart immediately
- Cart total recalculates
- If cart is now empty, empty cart message shown

**Failure Signals**
- Item remains after clicking remove
- Cart total does not update
- Page crashes after removal

---

### TEST-CART-06: Update Cart Item Quantity

**Preconditions**
- User is logged in with at least 1 item in cart

**Steps**
1. Navigate to `/cart`
2. Increase quantity of an item using the `+` button
3. Decrease quantity using the `-` button

**Expected Result**
- Quantity updates immediately
- Cart total recalculates
- Quantity cannot exceed available stock
- Quantity cannot go below 1 (use remove button for 0)

**Failure Signals**
- Quantity can be set above available stock
- Total does not update
- Quantity can be set to 0 or negative

---

## 2.4 Checkout Flow

---

### TEST-CHECKOUT-01: Complete COD Order

**Preconditions**
- User is logged in
- Cart has at least 1 item with sufficient stock
- At least 1 delivery address saved in account

**Steps**
1. Navigate to `/cart`
2. Click "Proceed to Checkout"
3. Select a delivery address
4. Select "Cash on Delivery" as payment method
5. Click "Place Order"

**Expected Result**
- Order confirmation page shown with order number
- Order appears in `/orders`
- Cart is cleared
- Stock is decremented in DB

**Failure Signals**
- Order placed but cart not cleared
- No order number shown
- Order does not appear in `/orders`
- Stock not decremented

---

### TEST-CHECKOUT-02: Checkout with No Address

**Preconditions**
- User is logged in with no saved addresses
- Cart has items

**Steps**
1. Navigate to checkout
2. Attempt to place order without selecting an address

**Expected Result**
- Error message: "Please select a delivery address"
- Order is NOT placed

**Failure Signals**
- Order placed with no address
- Silent failure with no error message

---

### TEST-CHECKOUT-03: Checkout with Empty Cart

**Preconditions**
- User is logged in with empty cart

**Steps**
1. Navigate directly to `/checkout`

**Expected Result**
- Redirected to `/cart` or error message: "Your cart is empty"
- No order created

**Failure Signals**
- Checkout page loads with empty cart
- Order created with 0 items

---

### TEST-CHECKOUT-04: Online Payment — Razorpay Modal

**Preconditions**
- User is logged in with items in cart and a saved address
- Razorpay test keys configured in `.env.local`

**Steps**
1. Proceed to checkout
2. Select "Online Payment"
3. Click "Place Order"
4. Observe Razorpay modal

**Expected Result**
- Razorpay payment modal opens
- Order is created in `pending` status in DB
- After successful test payment, order status updates to `paid`

**Failure Signals**
- Modal does not open
- Order not created before modal opens
- After payment, order status stays `pending`

---

### TEST-CHECKOUT-05: Payment Failure / Abandonment

**Preconditions**
- Razorpay test keys configured
- User at Razorpay modal

**Steps**
1. Open Razorpay modal
2. Close the modal without paying (click X)

**Expected Result**
- Order exists in DB with status `pending` and `paymentStatus: pending`
- User can retry payment from `/orders/[id]`
- Cart is cleared (order was already created)

**Failure Signals**
- Order not created on modal close
- Cart not cleared
- No way to retry payment from order page

---

### TEST-CHECKOUT-06: Stock Depletion During Checkout

**Preconditions**
- Product with `stockQuantity = 1` in cart
- Two browser sessions open simultaneously

**Steps**
1. Session A: Add the last-stock item to cart, proceed to checkout
2. Session B: Add the same item to cart and complete checkout first
3. Session A: Attempt to complete checkout

**Expected Result**
- Session A receives error: "Insufficient stock"
- Session A's order is NOT created
- Stock is not double-decremented

**Failure Signals**
- Both orders created, stock goes negative
- No error shown to Session A
- App crashes

---

## 2.5 Admin Flow

---

### TEST-ADMIN-01: Access Admin Dashboard

**Preconditions**
- Admin account exists

**Steps**
1. Navigate to `/auth/admin-login`
2. Log in with admin credentials
3. Observe the dashboard at `/admin`

**Expected Result**
- Dashboard loads with stats (orders, products, revenue)
- Sidebar shows: Products, Orders, Categories, Staff, Support, Settings
- No 403 or 404 errors

**Failure Signals**
- Dashboard shows empty stats on a seeded DB
- Sidebar items missing
- Any sidebar link returns 403

---

### TEST-ADMIN-02: Unauthorized Access to Admin Routes

**Preconditions**
- Logged in as a regular customer

**Steps**
1. Log in as a customer
2. Navigate directly to `/admin`
3. Navigate directly to `/admin/products`
4. Navigate directly to `/admin/settings`

**Expected Result**
- All routes redirect to `/auth/admin-login`
- No admin content visible

**Failure Signals**
- Any admin page loads for a customer
- Redirect goes to homepage instead of admin login

---

### TEST-ADMIN-03: Create a New Product

**Preconditions**
- Logged in as admin or staff
- At least 1 category exists

**Steps**
1. Navigate to `/admin/products/new`
2. Fill in: Name, SKU, Price, Stock, Description
3. Select a category
4. Upload at least 1 product image
5. Click Save / Create

**Expected Result**
- Product created and visible in `/admin/products`
- Product appears on the storefront
- Slug auto-generated from name

**Failure Signals**
- Form submits but product not created
- Duplicate slug error not shown when slug already exists
- Product created but not visible on storefront

---

### TEST-ADMIN-04: Create Product with Duplicate Slug

**Preconditions**
- A product with slug `ceramic-pot` already exists

**Steps**
1. Navigate to `/admin/products/new`
2. Enter a name that generates slug `ceramic-pot`
3. Click Save

**Expected Result**
- Error: "A product with this slug already exists"
- Product NOT created

**Failure Signals**
- Two products with the same slug created
- No error shown

---

### TEST-ADMIN-05: Edit an Existing Product

**Preconditions**
- At least 1 product exists

**Steps**
1. Navigate to `/admin/products`
2. Click Edit on any product
3. Change the price
4. Click Save

**Expected Result**
- Price updated in DB
- Updated price visible on storefront product page
- No other fields changed

**Failure Signals**
- Price not updated
- Other fields reset to defaults
- 500 error on save

---

### TEST-ADMIN-06: Create a Category

**Preconditions**
- Logged in as admin or staff

**Steps**
1. Navigate to `/admin/categories`
2. Click "New Category"
3. Enter name, slug, and set active = true
4. Click Save

**Expected Result**
- Category created and visible in list
- Category appears in storefront navigation

**Failure Signals**
- Category not created
- Duplicate slug not rejected
- Category not visible in navigation

---

### TEST-ADMIN-07: Create Sub-Category (Max 2 Levels)

**Preconditions**
- A root category exists

**Steps**
1. Create a sub-category under the root category (Level 2)
2. Attempt to create a sub-category under the Level 2 category (Level 3)

**Expected Result**
- Level 2 sub-category created successfully
- Level 3 attempt returns error: "Maximum 2 levels allowed"

**Failure Signals**
- 3-level nesting allowed
- No error on Level 3 attempt

---

### TEST-ADMIN-08: Update Order Status

**Preconditions**
- At least 1 order exists in `pending` status

**Steps**
1. Navigate to `/admin/orders`
2. Click on a pending order
3. Change status to "Processing"
4. Click Save

**Expected Result**
- Order status updated in DB
- Order timeline shows new event
- Customer's order page reflects new status

**Failure Signals**
- Status not updated
- Timeline not updated
- Customer order page still shows old status

---

### TEST-ADMIN-09: Staff Role Cannot Access Settings

**Preconditions**
- A staff account exists (role = `staff`)

**Steps**
1. Log in as staff
2. Navigate to `/admin/settings`

**Expected Result**
- Access denied or redirect to admin dashboard
- Settings page NOT accessible to staff

**Failure Signals**
- Staff can view or modify system settings

---

### TEST-ADMIN-10: Add New Staff Member

**Preconditions**
- Logged in as admin

**Steps**
1. Navigate to `/admin/staff`
2. Click "Add Staff Member"
3. Enter email, full name, role = "staff", password
4. Click Save

**Expected Result**
- New staff member created in Supabase Auth and DB
- Staff member appears in the list
- New staff can log in at `/auth/admin-login`

**Failure Signals**
- Staff created in DB but not in Supabase Auth (or vice versa)
- New staff cannot log in
- No confirmation shown

---

## 2.6 Support System

---

### TEST-SUPPORT-01: Create Support Ticket (Authenticated)

**Preconditions**
- User is logged in

**Steps**
1. Navigate to `/support`
2. Click "Open a Ticket"
3. Fill in: Subject, Category, Message
4. Click Submit

**Expected Result**
- Ticket created with a unique ticket number (e.g. `TKT-1234567890`)
- Ticket visible in `/account` or `/support/tickets`
- Status shows "Open"

**Failure Signals**
- Ticket not created
- No ticket number shown
- Ticket not visible in account

---

### TEST-SUPPORT-02: Create Support Ticket (Guest)

**Preconditions**
- User is NOT logged in

**Steps**
1. Navigate to `/support`
2. Click "Open a Ticket"

**Expected Result**
- Redirected to `/auth/login`
- After login, returned to support form

**Failure Signals**
- Ticket form accessible without login
- Ticket created without user association

---

### TEST-SUPPORT-03: Customer Reply to Own Ticket

**Preconditions**
- User is logged in with an open ticket

**Steps**
1. Navigate to the ticket detail page
2. Type a reply message
3. Click Send

**Expected Result**
- Reply appears in the ticket thread
- `latestReplyAt` timestamp updates
- If ticket was resolved, status reopens to "Open"

**Failure Signals**
- Reply not saved
- Ticket status does not reopen
- Reply appears but timestamp not updated

---

### TEST-SUPPORT-04: Customer Cannot Reply to Another User's Ticket

**Preconditions**
- Two customer accounts exist
- Customer A has an open ticket

**Steps**
1. Log in as Customer B
2. Navigate directly to Customer A's ticket URL

**Expected Result**
- 403 or "Unauthorized" error
- Ticket content NOT visible to Customer B

**Failure Signals**
- Customer B can view or reply to Customer A's ticket

---

### TEST-SUPPORT-05: Admin Assigns and Replies to Ticket

**Preconditions**
- Logged in as admin
- At least 1 open ticket exists

**Steps**
1. Navigate to `/admin/support`
2. Click on an open ticket
3. Click "Assign to Me"
4. Type a reply and click Send

**Expected Result**
- Ticket assigned to the admin
- Reply visible in ticket thread
- Customer can see the admin reply on their ticket page

**Failure Signals**
- Assignment not saved
- Reply not visible to customer
- Admin reply shows wrong sender name

---

### TEST-SUPPORT-06: Admin Closes a Ticket

**Preconditions**
- Logged in as admin with an open ticket

**Steps**
1. Navigate to the ticket in `/admin/support`
2. Change status to "Resolved" or "Closed"
3. Click Save

**Expected Result**
- Ticket status updated to resolved/closed
- Ticket moves to closed section in admin list

**Failure Signals**
- Status not updated
- Ticket still appears in open queue

---

### TEST-SUPPORT-07: Submit Ticket with Empty Fields

**Preconditions**
- User is logged in

**Steps**
1. Navigate to the ticket creation form
2. Leave Subject or Message blank
3. Click Submit

**Expected Result**
- Form validation prevents submission
- Error messages shown on empty required fields

**Failure Signals**
- Empty ticket created in DB
- No validation error shown

---

## 2.7 Error Scenarios

---

### TEST-ERR-01: API Failure Simulation (Products)

**Preconditions**
- Access to browser DevTools

**Steps**
1. Open DevTools → Network tab
2. Right-click on the `/api/products` request
3. Select "Block request URL"
4. Refresh the homepage

**Expected Result**
- Graceful error state shown (e.g. "Unable to load products")
- Page does not crash with a white screen
- Navigation still works

**Failure Signals**
- Full page crash / white screen
- Unhandled JS error in console
- Infinite loading spinner with no timeout

---

### TEST-ERR-02: Network Interruption During Checkout

**Preconditions**
- User is at checkout with items in cart

**Steps**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Click "Place Order"

**Expected Result**
- Error message shown: "Network error" or "Please check your connection"
- Order NOT created
- Cart items preserved

**Failure Signals**
- Silent failure with no feedback
- Order partially created
- Cart cleared despite order failure

---

### TEST-ERR-03: Refresh During Checkout

**Preconditions**
- User is on the checkout page

**Steps**
1. Fill in checkout form
2. Press F5 to refresh before submitting

**Expected Result**
- Form resets or retains values (depending on implementation)
- No duplicate order created
- Cart still intact

**Failure Signals**
- Duplicate order created on refresh
- Cart cleared without order being placed

---

### TEST-ERR-04: Direct API Access Without Auth

**Preconditions**
- None (use browser or curl)

**Steps**
1. Open browser and navigate to `/api/cart`
2. Navigate to `/api/reviews`
3. Navigate to `/api/admin/products`
4. Navigate to `/api/admin/categories`

**Expected Result**
- All return `401 Unauthorized` JSON response
- No data leaked

**Failure Signals**
- Any endpoint returns data without authentication
- 500 error instead of 401
- HTML error page instead of JSON

---

### TEST-ERR-05: Malformed Request Body

**Preconditions**
- None (use browser DevTools or Postman)

**Steps**
1. Send `POST /api/cart` with body `{ "quantity": 1 }` (missing `productId`)
2. Send `POST /api/reviews` with body `{ "productId": "p1" }` (missing `rating`)
3. Send `POST /api/admin/staff` with body `{ "email": "not-an-email", "role": "superuser" }`

**Expected Result**
- All return `400 Bad Request` with descriptive error message
- No data written to DB

**Failure Signals**
- 500 error instead of 400
- Data partially written to DB
- Vague error message with no field indication

---

*End of Document*
