# Full System Blueprint: Uyarvom Ecommerce Platform

**Document Version:** 1.0.0  
**Status:** COMPLETE / EXHAUSTIVE  
**Authors:** Senior Software Architect  
**Project:** Uyarvom Ecommerce Platform

---

## 1. System Overview

### Purpose
Uyarvom is a high-performance, modern ecommerce platform designed to provide a premium shopping experience while offering robust administrative tools for catalog management, supply chain tracking, and customer support.

### Core Features
*   **Dynamic Catalog:** Hierarchical category management with SEO-optimized product pages.
*   **Advanced Product System:** Support for multi-variant products (color, size) with independent stock tracking.
*   **Seamless Cart & Checkout:** Real-time quantity validation, multi-address management, and integrated payment gateways.
*   **Supply Chain Integration:** Tracking of BIS compliance, supplier locations, and Minimum Order Quantity (MOQ).
*   **Support System:** Integrated ticketing for customers with internal threading for staff.
*   **Rich UI/UX:** High-fidelity animations using GSAP, Framer Motion, and Lenis smooth scrolling.

### User Roles
1.  **Customer:** Can browse products, manage cart, place orders, track shipments, and raise support tickets.
2.  **Staff:** Can manage products, process orders, and reply to support tickets.
3.  **Admin:** Full access to catalog, users, settings, and deletion approval workflows.
4.  **Super Admin:** Database-level and configuration-level overrides.

### High-Level Architecture
The system follows a **Modern Monolith** architecture using Next.js 16 (App Router). It leverages a server-centric approach with Server Components and Server Actions for logic, while maintaining a rich client layer for interactivity.

---

## 2. Tech Stack

### Frontend
*   **Framework:** Next.js 16.0.10 (App Router)
*   **Library:** React 19.2.0
*   **Styling:** Tailwind CSS 4.1.9 (Vanilla CSS principles)
*   **Components:** Radix UI (Headless), Lucide React (Icons), Shadcn UI patterns
*   **Animations:** GSAP 3.14.2, Framer Motion 12.23.26, Lenis 1.3.16 (Smooth Scroll)
*   **Forms:** React Hook Form, Zod (Validation)

### Backend
*   **Runtime:** Node.js (Vercel Edge/Serverless compatible)
*   **ORM:** Prisma 6.4.1
*   **Authentication:** Supabase Auth (via `@supabase/ssr`)
*   **Validation:** Zod schemas for all API and Action inputs

### Database
*   **Primary Database:** PostgreSQL (Hosted on Supabase)
*   **Connection Management:** PgBouncer (Port 6543) for app logic, Direct connection (Port 5432) for migrations

### External Services
*   **Auth:** Supabase Auth
*   **Payments:** Razorpay (UPI, NetBanking, Cards)
*   **Storage:** Cloudflare R2 (S3-compatible) for product images
*   **Deployment:** Vercel

---

## 3. Architecture Deep Dive

### Folder Structure
*   `__tests__/`: Vitest unit and integration tests grouped by module.
*   `app/`:
    *   `(routes)`: Next.js pages organized by domain (auth, products, admin, cart, etc.).
    *   `api/`: REST endpoints for client-side fetches and external integrations.
*   `components/`:
    *   `admin/`: Specialized dashboards and forms for staff/admins.
    *   `ui/`: Atomic design components (Button, Input, Card).
    *   `features/`: Complex components like `AiKitchenMatch`, `ProductGallery`.
*   `lib/`:
    *   `actions/`: Next.js Server Actions (Mutation logic).
    *   `supabase/`: Client and Server initialization for Supabase.
    *   `prisma.ts`: Singleton Prisma client instance.
*   `prisma/`: `schema.prisma` and SQL migrations.
*   `scripts/`: Automation scripts (e.g., `import-products-from-excel.js`).
*   `public/`: Static assets and local upload fallback.

### Design Patterns
*   **Proxy Pattern:** `middleware.ts` acts as a security proxy layer, intercepting requests to check for auth status and database connectivity before reaching the application logic.
*   **Server Actions:** Core business logic is encapsulated in server actions (`@/lib/actions/`) to minimize client-side bundle size and secure database operations.
*   **Repository Pattern (Implicit):** Prisma acts as the data access layer, centralizing all queries.
*   **Adapter Pattern:** `lib/supabase/server.ts` adapts Supabase Auth to the Next.js App Router environment using cookies.

### Data Flow
1.  **Request:** User hits a route (e.g., `/admin/products`).
2.  **Middleware:** Checks if the user has `staff` or `admin` role in Supabase.
3.  **Server Component:** Fetches initial data via `prisma` directly.
4.  **Client Hydration:** GSAP/Lenis initializes animations.
5.  **Mutation:** User submits a form → Server Action runs → DB updates → `revalidatePath` updates cache.

---

## 4. Authentication & Authorization

### Login Flow
1.  User enters credentials in `/auth/login`.
2.  `supabase.auth.signInWithPassword` is called.
3.  Session cookie is set.
4.  `middleware.ts` detects the session and verifies roles against the `admin_users` table for protected routes.

### Role-Based Access Control (RBAC)
*   **Public:** Access to home, products, search.
*   **Customer:** Access to `/account`, `/orders`, `/checkout`.
*   **Staff:** Access to `/admin` (Product/Order management), but restricted from system settings.
*   **Admin/Super Admin:** Full access to `/admin`, including staff management and deletion approvals.

### Middleware Behavior
*   **Timeout Protection:** 15s timeout for Supabase Auth calls to prevent hang-ups.
*   **Silent Recovery:** If the database/auth is unreachable, the system enters a "read-only" recovery mode where possible or redirects to a safe page.

---

## 5. API Documentation

### Product APIs

#### `GET /api/products`
*   **Purpose:** Fetch products with filtering.
*   **Query Params:**
    *   `category` (string, optional): Slug of the category.
    *   `search` (string, optional): Keywords for name/description.
    *   `sort` (enum: `price-asc`, `price-desc`, `newest`, `name`): Default `newest`.
    *   `page`, `limit` (int): Pagination params.
*   **Response:** `{ products: Product[], pagination: { total, pages } }`

#### `POST /api/admin/products`
*   **Auth:** Requires `Staff` role.
*   **Request Body:** Zod-validated Product object including `images` and `colorVariants`.
*   **Validation:** Unique `slug` and `sku` checks.
*   **Error Cases:** 400 (Slug exists), 403 (Unauthorized).

### Cart APIs

#### `POST /api/cart`
*   **Purpose:** Add item to cart.
*   **Request Body:** `{ productId, variantId, quantity }`.
*   **Logic:** Validates stock in `product_variants` or `products`. Deducts stock logic is handled during checkout, NOT cart addition.

---

## 6. Database Design (Prisma Schema)

### Core Tables

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `users` | All shoppers and admins | `id (UUID)`, `email`, `fullName`, `phone` |
| `products` | Base product data | `id (CUID)`, `name`, `price`, `stockQuantity`, `sku`, `bis` |
| `product_variants` | Product variations | `id`, `productId`, `name (Size/Color)`, `value`, `stock` |
| `orders` | Transaction history | `id`, `orderNumber`, `total`, `status`, `paymentStatus` |
| `order_items` | Snapshot of products in order | `id`, `orderId`, `productId`, `priceSnapshot` |
| `support_tickets` | Customer service tickets | `id`, `ticketNumber`, `status (open/closed)`, `priority` |

### Key Relationships
*   `Product` → `1:N` → `ProductImage`
*   `Product` → `N:N` → `Category` (via `ProductCategory`)
*   `Order` → `1:N` → `OrderItem`
*   `User` → `1:1` → `AdminUser` (Role definition)

---

## 7. Core Features Breakdown

### Product System
*   **Hierarchy:** Main Category -> Sub Category.
*   **Variant Logic:** Supports color variants with independent image galleries.
*   **Edge Case:** If a product has variants, the base `stockQuantity` is ignored in favor of `variant.stock`.

### Checkout System
*   **Flow:** Select Address -> Choose Payment (COD/Online) -> Razorpay Modal -> Confirmation.
*   **Backend Logic:** Transactional update! In one `prisma.$transaction`:
    1.  Create Order.
    2.  Create OrderItems.
    3.  Deduct Stock.
    4.  Clear Cart.
*   **Failure Scenario:** If payment fails at Razorpay, the order is created in `pending` status, and the user is redirected to pay from the "Order Details" page.

---

## 8. Frontend Architecture

### State Management
*   **Server State:** Managed by Next.js `revalidatePath` and `revalidateTag`.
*   **UI State:** Local `useState` for modals, filters, and dynamic calculations.
*   **Theme:** `next-themes` (Dark/Light/System support).

### Key Components
*   `AiKitchenMatch`: A complex interaction tool for matching kitchenware based on user preferences.
*   `FlipkartProductGallery`: A high-fidelity image viewer with zoom and thumbnail navigation.
*   `AdminDashboard`: Real-time stats and order monitoring using `recharts`.

---

## 9. Testing Strategy

### Unit Tests (Vitest)
*   **Coverage:** Auth middleware, Server Actions (Support, Ordering), Stock logic.
*   **Command:** `npm run test:unit`

### E2E Tests (Playwright)
*   **Coverage:** Full checkout flow (Guest -> Login -> Payment redirect), Admin product creation, Support ticketing.
*   **Command:** `npm run test:e2e`

---

## 10. Error Handling & Logging

*   **Global Boundary:** `app/error.tsx` catches rendering crashes.
*   **API Errors:** Standardized JSON responses `{ error: "message" }` with appropriate status codes (400, 401, 403, 404, 500).
*   **Logging:** Server-side `console.error` logs are captured by Vercel Runtime Logs. Direct DB logs are tracked in the `AuditLog` table for sensitive admin actions.

---

## 11. Security Considerations

*   **Input Sanitization:** Handled by Zod schemas during parse.
*   **Rate Limiting:** Implemented at the Supabase/Vercel edge level (API protection).
*   **Auth Protection:** All admin APIs use `requireStaffAccess` middleware which verifies session + database role.
*   **Credential Masking:** DATABASE_URL and API Keys strictly stored in `.env.local` and Vercel Environment variables.

---

## 12. Performance Considerations

*   **Image Optimization:** Next.js `next/image` handles all R2/Local images with automatic WebP conversion and resizing.
*   **Animations:** GSAP `scrollTrigger` uses optimized frame-independent tickers.
*   **Database:** PgBouncer used to handle high-frequency connection pooling for Serverless functions.

---

## 13. Deployment & Environment

### Build Process
1.  `npm install`
2.  `npx prisma generate` (Creates Typescript client)
3.  `next build` (Static Analysis & SSR optimization)

### Environment Variables (Required)
*   `DATABASE_URL`: Port 6543 (Pooler)
*   `DIRECT_URL`: Port 5432 (Migrations)
*   `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`
*   `R2_BUCKET_NAME` / `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY`
*   `RAZORPAY_KEY_ID` / `SECRET`

---

## 14. Known Issues & Limitations

*   **Stock Lock:** Stock is deducted at the start of payment. If a user abandons the payment at the gateway, the stock stays deducted for 15 minutes (or until manual cleanup). **NOT IMPLEMENTED:** Automated stock reversal for expired Razorpay sessions.
*   **Returns:** Return flow is defined in the schema but the UI for "Return Approval/Pickup" is **WORK IN PROGRESS**.
*   **AI Match:** Currently uses heuristic-based matching; LLM-based personalization is **NOT IMPLEMENTED**.

---

## 15. Future Improvements

*   **Real-time Inventory:** WebSocket/Subscription integration for stock alerts.
*   **Advanced Analytics:** Integration with Google Analytics 4 and custom conversion tracking for the admin panel.
*   **Internationalization:** Multi-language support (English/Tamil) for UI elements.
