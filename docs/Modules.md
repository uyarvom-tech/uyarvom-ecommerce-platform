
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\lib
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\lib\actions
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\admin\products
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\admin\categories
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\admin\staff
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\products
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\reviews
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\user
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\admin\upload
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\checkout\verify
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\health
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\api\ping
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\auth
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\catalog
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\orders
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\support
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\tickets
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\settings
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\merchandising
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\app\admin\inventory
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\__tests__
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\__tests__\api
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\e2e
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\lib\supabase
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\components\admin
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\scripts
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\hooks
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\components\ui
Analyzed
d:\HP_FILES\Uyarvom\uyarvom-ecommerce-platform\prisma
Now I have a complete picture of the real codebase. Here is the full modules list:

Modules List
Core Modules
auth
auth-middleware
prisma-client
supabase-client
supabase-server
supabase-proxy
supabase-resilience
middleware
settings
user-sync
use-user
Feature Modules
product-catalog
product-variants
product-images
category-hierarchy
cart
checkout
checkout-verify (Razorpay)
orders
order-events
reviews
wishlist
delivery-checker
ai-kitchen-match
merchandising
inventory
support-tickets
support-messages
deletion-tickets
hero-banners
audit-log
system-settings
search
API Modules
GET /api/products
GET /api/products/[slug]
GET /api/products/search
GET /api/products/suggestions
POST /api/cart
PUT /api/cart/[id]
DELETE /api/cart/[id]
POST /api/checkout/verify
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/reviews
POST /api/reviews
DELETE /api/reviews/[id]
GET /api/user/profile
POST /api/upload
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products
GET /api/admin/products/[id]
POST /api/admin/products/bulk
GET /api/admin/products/search
GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/[id]
DELETE /api/admin/categories/[id]
GET /api/admin/categories/search
POST /api/admin/upload
POST /api/admin/upload/category
GET /api/admin/staff
POST /api/admin/staff
DELETE /api/admin/staff/[id]
GET /api/admin/deletion-tickets
PUT /api/admin/deletion-tickets/[id]
GET /api/health
GET /api/ping
UI Modules
Header
Footer
MobileMenu
HeroCarousel
HomeMainHero
SaleBanner
TrustBlocks
ProductCard
ProductVariantSelector
ProductSizeSelector
ProductGallery
FlipkartProductGallery
ProductFilters
ProductsSearch
ProductReviews
ProductHorizontalScroll
CategoryNavigation
CategoriesDropdown
CategoryCarousel
CategoryTiltedCard
CartButton
CartItemsList
HeaderCartButton
CheckoutForm
OrderActions
OrderTimeline
OrderStatusUpdater
AddToCartButton
WishlistButton
WishlistGrid
SupportForm
SupportReplyForm
DeliveryChecker
AiKitchenMatch
FloatingAiButton
AuthButton
AccountForm
AccountTabs
AddressesList
SearchBar
SearchResults
ThemeToggle
ThemeProvider
SecretThemeProvider
ClickSpark
GlobalClickSpark
GhostCursor
CursorGlow
ScrollFloat
ScrollStack
SpotlightCard
TiltedCard
LogoLoop
CustomerReviewsLoop
HeroSection
CardNav
DevNotice
OfferCopyButton
AdminConsoleButton
AdminHeader
AdminAwareLink
AdminAwareLogo
AdminAwareNavigation
AdminCustomerToggle
StockAdjuster
ProductEditor
CategoryManager
Infrastructure Modules
prisma-schema
prisma-migrations
prisma-seed
cloudflare-r2
razorpay-integration
supabase-auth
postgre-sql-pooler (pgBouncer)
vercel-deployment
next-config
tailwind-config
vitest-config
playwright-config
image-fallbacks
admin-navigation
category-navigation-data
Support Modules
import-products-from-excel
upload-to-r2 (script)
migrate-to-production (script)
run-all-tests (script)
test-auth-middleware
test-support
test-admin-support
test-cart-api
test-orders-api
test-admin-products-api
e2e-customer-checkout
e2e-admin-dashboard
e2e-support-admin
admin-product-management (component)
admin-category-management (component)
admin-color-variant-manager (component)
admin-image-upload (component)
admin-staff-management (component)
admin-ticket-management (component)
admin-deletion-ticket-modal (component)
admin-setting-form (component)
admin-support-actions (component)
admin-variant-management (component)
