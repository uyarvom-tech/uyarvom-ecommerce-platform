-- Drop all existing policies on admin_users to fix infinite recursion
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admin role can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admin role can update admin users" ON public.admin_users;

-- Create simpler admin_users policies without recursion
-- Allow users to view admin_users if they themselves are in the table
CREATE POLICY "Admins can view all admin users" ON public.admin_users FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- For insert/update, we'll use a function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
  );
$$;

-- Now recreate policies using the function for write operations
CREATE POLICY "Only admins can insert admin users" ON public.admin_users FOR INSERT WITH CHECK (
  public.is_admin() AND auth.uid() IN (SELECT id FROM public.admin_users WHERE role = 'admin')
);

CREATE POLICY "Only admins can update admin users" ON public.admin_users FOR UPDATE USING (
  public.is_admin() AND auth.uid() IN (SELECT id FROM public.admin_users WHERE role = 'admin')
);

-- Update other policies to use the helper function instead of subquery
-- This prevents recursion in complex queries

-- Drop and recreate categories policies
DROP POLICY IF EXISTS "Only admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON public.categories;

CREATE POLICY "Only admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Only admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- Drop and recreate products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Only admins can insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can update products" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Only admins can delete products" ON public.products FOR DELETE USING (public.is_admin());

-- Drop and recreate product images policies
DROP POLICY IF EXISTS "Only admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Only admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Only admins can delete product images" ON public.product_images;

CREATE POLICY "Only admins can insert product images" ON public.product_images FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can update product images" ON public.product_images FOR UPDATE USING (public.is_admin());
CREATE POLICY "Only admins can delete product images" ON public.product_images FOR DELETE USING (public.is_admin());

-- Drop and recreate product variants policies
DROP POLICY IF EXISTS "Only admins can insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Only admins can update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Only admins can delete variants" ON public.product_variants;

CREATE POLICY "Only admins can insert variants" ON public.product_variants FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can update variants" ON public.product_variants FOR UPDATE USING (public.is_admin());
CREATE POLICY "Only admins can delete variants" ON public.product_variants FOR DELETE USING (public.is_admin());

-- Drop and recreate orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Only admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin());

-- Drop and recreate order items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR
  public.is_admin()
);

-- Drop and recreate reviews policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());

-- Drop and recreate inventory logs policies
DROP POLICY IF EXISTS "Admins can view inventory logs" ON public.inventory_logs;
DROP POLICY IF EXISTS "Admins can insert inventory logs" ON public.inventory_logs;

CREATE POLICY "Admins can view inventory logs" ON public.inventory_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert inventory logs" ON public.inventory_logs FOR INSERT WITH CHECK (public.is_admin());
