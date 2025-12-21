-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_number);
    counter := counter + 1;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Function to update inventory after order
CREATE OR REPLACE FUNCTION public.update_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update product stock
  IF NEW.variant_id IS NULL THEN
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSE
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update inventory when order item is created
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_order();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
