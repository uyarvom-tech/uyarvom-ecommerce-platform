# Role-Based Access Control Plan

## Current Problem
All three user roles (Admin, Staff, Customer) currently have the same access levels and permissions. There's no meaningful difference between them in terms of functionality or restrictions.

## Proposed Role Hierarchy & Permissions

### 🔴 ADMIN ROLE (Highest Authority)
**Users**: admin@uyarvom.com, superadmin@uyarvom.com

**Full System Access**:
- Complete admin dashboard access
- User management (view, edit, delete customers and staff)
- Product management (create, edit, delete, bulk operations)
- Category management (create, edit, delete, reorder)
- Order management (view all orders, update status, refunds)
- Inventory management (stock adjustments, low stock alerts)
- Financial reports (sales, revenue, analytics)
- System settings (site configuration, payment settings)
- Staff management (promote/demote users, assign roles)

**Unique Admin Features**:
- Delete products permanently
- Access financial data and reports
- Manage other admin/staff accounts
- System-wide configuration changes
- Bulk import/export operations

---

### 🟠 STAFF ROLE (Limited Admin Access)
**Users**: staff@uyarvom.com, manager@uyarvom.com

**Operational Access**:
- Limited admin dashboard (operations focused)
- Product management (create, edit - no delete)
- Order management (view, update status - no refunds)
- Inventory management (stock updates only)
- Customer support (view customer orders, basic info)

**Restrictions**:
- ❌ Cannot delete products (only deactivate)
- ❌ Cannot access financial reports
- ❌ Cannot manage other users
- ❌ Cannot change system settings
- ❌ Cannot process refunds
- ❌ Cannot see cost/profit data

**Staff-Specific Features**:
- Order fulfillment workflow
- Stock management alerts
- Customer inquiry handling
- Basic sales reporting (units only, no revenue)

---

### 🔵 CUSTOMER ROLE (Shopping Only)
**Users**: customer@example.com, jane@example.com, demo@example.com

**Shopping Experience**:
- Browse products and categories
- Search and filter products
- Add items to cart and wishlist
- Checkout and payment process
- Order history and tracking
- Account profile management
- Address book management
- Product reviews and ratings

**Restrictions**:
- ❌ No admin dashboard access
- ❌ Cannot see other customers' data
- ❌ Cannot modify product information
- ❌ Cannot access inventory data
- ❌ Cannot see cost prices or margins

**Customer-Specific Features**:
- Personalized recommendations
- Order tracking and notifications
- Wishlist and favorites
- Review and rating system
- Loyalty points (future feature)

---

## Implementation Plan

### Phase 1: Route Protection
1. **Admin Routes** (`/admin/*`)
   - Block customer access completely
   - Allow staff limited access to specific pages
   - Full access for admins

2. **Staff-Limited Routes**
   - `/admin/products` - Staff can edit, not delete
   - `/admin/orders` - Staff can update status, not refund
   - `/admin/inventory` - Staff can adjust stock only

3. **Admin-Only Routes**
   - `/admin/users` - User management
   - `/admin/settings` - System configuration
   - `/admin/reports` - Financial reports
   - `/admin/categories` - Category management

### Phase 2: UI Differentiation
1. **Admin Dashboard**
   - Full sidebar with all options
   - Financial widgets and reports
   - User management section
   - System health monitoring

2. **Staff Dashboard**
   - Limited sidebar (no users, settings, reports)
   - Order fulfillment focused
   - Inventory management tools
   - Customer support tools

3. **Customer Interface**
   - Shopping-focused navigation
   - Account management only
   - Order history and tracking
   - No admin elements visible

### Phase 3: Data Access Control
1. **Admin Data Access**
   - All customer data
   - All order data with financial info
   - Product cost and margin data
   - System analytics and reports

2. **Staff Data Access**
   - Customer orders (no personal details)
   - Product data (no cost/margin info)
   - Inventory levels and alerts
   - Basic sales metrics (units only)

3. **Customer Data Access**
   - Own profile and orders only
   - Public product information
   - Own wishlist and cart
   - Own reviews and ratings

### Phase 4: Feature Implementation
1. **Admin Features**
   - User role management interface
   - Financial reporting dashboard
   - System configuration panel
   - Bulk operations for products

2. **Staff Features**
   - Order fulfillment workflow
   - Stock management interface
   - Customer support tools
   - Basic reporting (non-financial)

3. **Customer Features**
   - Enhanced shopping experience
   - Order tracking system
   - Review and rating system
   - Wishlist management

---

## Technical Implementation

### Database Changes Needed
1. Add role-based permissions table
2. Create admin_permissions table
3. Add staff_restrictions table
4. Implement row-level security

### Component Updates Required
1. **Header Component** - Role-based menu items
2. **Admin Sidebar** - Different menus per role
3. **Product Cards** - Hide cost data from staff
4. **Order Components** - Role-based action buttons

### Route Middleware Updates
1. Enhanced role checking in proxy.ts
2. Page-level permission validation
3. API endpoint protection
4. Component-level access control

---

## Success Criteria

### Admin Role Success
- ✅ Can access all admin features
- ✅ Can manage users and roles
- ✅ Can see financial data
- ✅ Can configure system settings

### Staff Role Success
- ✅ Can manage products (limited)
- ✅ Can handle orders (no refunds)
- ✅ Can update inventory
- ❌ Cannot access financial data
- ❌ Cannot manage users

### Customer Role Success
- ✅ Can shop and checkout
- ✅ Can manage own account
- ✅ Can track orders
- ❌ Cannot access any admin features
- ❌ Cannot see other customers' data

---

## Current Status
- ❌ All roles have same access (PROBLEM)
- ❌ No meaningful role differentiation
- ❌ Admin dashboard accessible to all authenticated users
- ❌ No data access restrictions

## Next Steps
1. Implement route-level restrictions
2. Create role-specific UI components
3. Add data access controls
4. Test each role thoroughly
5. Document role capabilities