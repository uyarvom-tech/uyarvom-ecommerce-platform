-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can insert categories" ON public.categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can update categories" ON public.categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can delete categories" ON public.categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Only admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Product images policies
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Only admins can insert product images" ON public.product_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can update product images" ON public.product_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can delete product images" ON public.product_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Product variants policies
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Only admins can insert variants" ON public.product_variants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can update variants" ON public.product_variants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admins can delete variants" ON public.product_variants FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Addresses policies
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Cart items policies
CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Order items policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);

-- Wishlists policies
CREATE POLICY "Users can view their own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wishlist items" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlist items" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Admin users policies
CREATE POLICY "Admins can view all admin users" ON public.admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Only admin role can insert admin users" ON public.admin_users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admin role can update admin users" ON public.admin_users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin')
);

-- Inventory logs policies
CREATE POLICY "Admins can view inventory logs" ON public.inventory_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
CREATE POLICY "Admins can insert inventory logs" ON public.inventory_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
