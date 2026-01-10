-- Insert sample categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Cookware', 'cookware', 'Premium ceramic cookware for everyday cooking', 1),
  ('Bakeware', 'bakeware', 'High-quality baking dishes and pans', 2),
  ('Dinnerware', 'dinnerware', 'Beautiful ceramic plates, bowls, and serving dishes', 3),
  ('Kitchen Tools', 'kitchen-tools', 'Essential ceramic kitchen accessories', 4);

-- Insert sample products
INSERT INTO public.products (name, slug, description, short_description, price, compare_at_price, sku, stock_quantity, category_id, is_active, is_featured) VALUES
  (
    'Ceramic Frying Pan',
    'ceramic-frying-pan',
    'Premium non-stick ceramic frying pan with ergonomic handle. Perfect for healthy cooking with minimal oil. PFOA-free coating ensures safe cooking. Heat-resistant up to 400°F.',
    'Non-stick ceramic frying pan for healthy cooking',
    2499.00,
    3499.00,
    'CFP-001',
    50,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    true
  ),
  (
    'Ceramic Sauce Pan with Lid',
    'ceramic-sauce-pan-lid',
    'Durable ceramic sauce pan with tempered glass lid. Even heat distribution for perfect sauces and soups. Easy to clean non-stick surface.',
    'Versatile sauce pan for everyday cooking',
    1999.00,
    2799.00,
    'CSP-001',
    35,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    true
  ),
  (
    'Ceramic Baking Dish Set',
    'ceramic-baking-dish-set',
    'Complete set of 3 ceramic baking dishes in different sizes. Oven-safe up to 500°F. Perfect for casseroles, lasagna, and roasted vegetables.',
    'Set of 3 versatile baking dishes',
    3499.00,
    4999.00,
    'CBD-001',
    25,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    false
  ),
  (
    'Ceramic Dinner Plate Set',
    'ceramic-dinner-plate-set',
    'Elegant set of 6 dinner plates. Microwave and dishwasher safe. Chip-resistant ceramic construction. Modern minimalist design.',
    'Set of 6 modern dinner plates',
    2999.00,
    NULL,
    'CDP-001',
    60,
    (SELECT id FROM public.categories WHERE slug = 'dinnerware'),
    true,
    true
  ),
  (
    'Ceramic Mixing Bowl Set',
    'ceramic-mixing-bowl-set',
    'Nested set of 3 mixing bowls for all your food prep needs. Non-slip base for stability. Easy pour spouts. Stackable for compact storage.',
    'Set of 3 nesting mixing bowls',
    1799.00,
    2299.00,
    'CMB-001',
    40,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  ),
  (
    'Ceramic Dutch Oven',
    'ceramic-dutch-oven',
    'Large capacity ceramic Dutch oven perfect for slow cooking, braising, and stews. Heavy-duty construction with excellent heat retention. Oven-safe up to 500°F.',
    'Premium Dutch oven for slow cooking',
    4999.00,
    6999.00,
    'CDO-001',
    15,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    true
  );

-- Insert sample product images (using placeholder images)
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
  (
    (SELECT id FROM public.products WHERE sku = 'CFP-001'),
    '/placeholder.svg?height=600&width=600',
    'Ceramic Frying Pan',
    1,
    true
  ),
  (
    (SELECT id FROM public.products WHERE sku = 'CSP-001'),
    '/placeholder.svg?height=600&width=600',
    'Ceramic Sauce Pan with Lid',
    1,
    true
  ),
  (
    (SELECT id FROM public.products WHERE sku = 'CBD-001'),
    '/placeholder.svg?height=600&width=600',
    'Ceramic Baking Dish Set',
    1,
    true
  ),
  (
    (SELECT id FROM public.products WHERE sku = 'CDP-001'),
    '/placeholder.svg?height=600&width=600',
    'Ceramic Dinner Plate Set',
    1,
    true
  ),
  (
    (SELECT id FROM public.products WHERE sku = 'CMB-001'),
    '/placeholder.svg?height=600&width=600',
    'Ceramic Mixing Bowl Set',
    1,
    true
  ),
  (
    (SELECT id FROM public.products WHERE sku = 'CDO-001'),
    '/placeholder.svg?height=600&width=600',
    'Ceramic Dutch Oven',
    1,
    true
  );
