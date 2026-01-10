-- Adding many more premium ceramic products for a full catalog

-- Add more cookware products
INSERT INTO public.products (name, slug, description, short_description, price, compare_at_price, sku, stock_quantity, category_id, is_active, is_featured) VALUES
  (
    'Ceramic Wok Pan',
    'ceramic-wok-pan',
    'Large 12-inch ceramic wok perfect for stir-frying, steaming, and Asian cooking. Even heat distribution and non-stick surface make cooking effortless. Ergonomic stay-cool handle.',
    'Professional-grade wok for authentic Asian cooking',
    3299.00,
    4499.00,
    'CWP-001',
    30,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    true
  ),
  (
    'Ceramic Stock Pot',
    'ceramic-stock-pot',
    '8-quart ceramic stock pot ideal for soups, stocks, and pasta. Heavy-duty construction with tight-fitting lid retains heat and moisture. Dishwasher and oven safe.',
    'Large capacity pot for soups and stocks',
    4299.00,
    5999.00,
    'CST-001',
    20,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    false
  ),
  (
    'Ceramic Grill Pan',
    'ceramic-grill-pan',
    'Ridged ceramic grill pan brings outdoor flavor indoors. Raised ridges create perfect grill marks while draining excess fat. Works on all stovetops.',
    'Indoor grill pan with perfect sear marks',
    2799.00,
    3699.00,
    'CGP-001',
    35,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    true
  ),
  (
    'Ceramic Skillet Set',
    'ceramic-skillet-set',
    'Complete set of 3 skillets in 8", 10", and 12" sizes. Versatile for any cooking task from eggs to steaks. Nests for compact storage.',
    'Set of 3 essential skillets',
    5499.00,
    7999.00,
    'CSS-001',
    18,
    (SELECT id FROM public.categories WHERE slug = 'cookware'),
    true,
    false
  );

-- Add more bakeware products
INSERT INTO public.products (name, slug, description, short_description, price, compare_at_price, sku, stock_quantity, category_id, is_active, is_featured) VALUES
  (
    'Ceramic Loaf Pan',
    'ceramic-loaf-pan',
    'Classic ceramic loaf pan for breads, meatloaf, and pound cakes. Non-stick surface ensures easy release. Measures 9x5 inches, perfect standard size.',
    'Essential loaf pan for baking',
    1299.00,
    1799.00,
    'CLP-001',
    45,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    false
  ),
  (
    'Ceramic Pie Dish',
    'ceramic-pie-dish',
    'Beautiful 9-inch ceramic pie dish with decorative fluted edge. Even heat distribution for perfectly baked crusts. Goes from oven to table beautifully.',
    'Classic pie dish with fluted edge',
    1599.00,
    NULL,
    'CPD-001',
    50,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    true
  ),
  (
    'Ceramic Muffin Pan',
    'ceramic-muffin-pan',
    '12-cup ceramic muffin pan with non-stick coating. Perfect for muffins, cupcakes, and individual portions. Easy to clean and dishwasher safe.',
    'Professional 12-cup muffin pan',
    2299.00,
    2999.00,
    'CMP-001',
    28,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    false
  ),
  (
    'Ceramic Roasting Pan',
    'ceramic-roasting-pan',
    'Large rectangular roasting pan perfect for whole chickens, roasts, and vegetables. 14x10 inch size with high sides to contain juices. Oven-safe to 500°F.',
    'Premium roasting pan for family meals',
    3899.00,
    5299.00,
    'CRP-001',
    22,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    true
  ),
  (
    'Ceramic Tart Pan',
    'ceramic-tart-pan',
    'Elegant 11-inch ceramic tart pan with removable bottom. Perfect for French tarts and quiches. Fluted edges create beautiful presentation.',
    'Professional tart pan with removable bottom',
    1899.00,
    2499.00,
    'CTP-001',
    32,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    false
  ),
  (
    'Ceramic Ramekin Set',
    'ceramic-ramekin-set',
    'Set of 6 ceramic ramekins, 6oz each. Perfect for crème brûlée, soufflés, and individual desserts. Stackable for easy storage. Microwave and oven safe.',
    'Set of 6 versatile ramekins',
    1699.00,
    NULL,
    'CRS-001',
    55,
    (SELECT id FROM public.categories WHERE slug = 'bakeware'),
    true,
    false
  );

-- Add more dinnerware products
INSERT INTO public.products (name, slug, description, short_description, price, compare_at_price, sku, stock_quantity, category_id, is_active, is_featured) VALUES
  (
    'Ceramic Bowl Set',
    'ceramic-bowl-set',
    'Set of 6 ceramic bowls in modern minimalist design. Perfect for soups, salads, and cereals. Microwave and dishwasher safe. Chip-resistant construction.',
    'Set of 6 elegant ceramic bowls',
    2499.00,
    3299.00,
    'CBS-001',
    42,
    (SELECT id FROM public.categories WHERE slug = 'dinnerware'),
    true,
    false
  ),
  (
    'Ceramic Serving Platter',
    'ceramic-serving-platter',
    'Large oval serving platter, 16 inches long. Ideal for entertaining and special occasions. Beautiful glaze finish that complements any table setting.',
    'Premium serving platter for entertaining',
    2199.00,
    NULL,
    'CSP-002',
    28,
    (SELECT id FROM public.categories WHERE slug = 'dinnerware'),
    true,
    true
  ),
  (
    'Ceramic Mug Set',
    'ceramic-mug-set',
    'Set of 4 handcrafted ceramic mugs, 12oz each. Comfortable C-handle design. Perfect for coffee, tea, or hot chocolate. Artisan-quality construction.',
    'Set of 4 artisan ceramic mugs',
    1499.00,
    1999.00,
    'CMS-001',
    60,
    (SELECT id FROM public.categories WHERE slug = 'dinnerware'),
    true,
    false
  ),
  (
    'Ceramic Salad Plates Set',
    'ceramic-salad-plates-set',
    'Set of 6 salad plates, 8 inches each. Perfect size for appetizers, desserts, or side dishes. Coordinates beautifully with dinner plate set.',
    'Set of 6 versatile salad plates',
    1899.00,
    2499.00,
    'CSPS-001',
    48,
    (SELECT id FROM public.categories WHERE slug = 'dinnerware'),
    true,
    false
  ),
  (
    'Ceramic Dinner Set',
    'ceramic-dinner-set',
    'Complete 24-piece dinner set for 6 people. Includes 6 dinner plates, 6 salad plates, 6 bowls, and 6 mugs. Modern design perfect for everyday use or entertaining.',
    'Complete 24-piece dinner service',
    7999.00,
    10999.00,
    'CDS-001',
    15,
    (SELECT id FROM public.categories WHERE slug = 'dinnerware'),
    true,
    true
  );

-- Add kitchen tools products
INSERT INTO public.products (name, slug, description, short_description, price, compare_at_price, sku, stock_quantity, category_id, is_active, is_featured) VALUES
  (
    'Ceramic Utensil Holder',
    'ceramic-utensil-holder',
    'Elegant ceramic utensil holder for countertop storage. Holds spatulas, spoons, and other cooking tools. Heavy weighted base prevents tipping.',
    'Stylish countertop utensil organizer',
    899.00,
    1299.00,
    'CUH-001',
    55,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  ),
  (
    'Ceramic Spoon Rest',
    'ceramic-spoon-rest',
    'Decorative ceramic spoon rest keeps counters clean while cooking. Large enough for multiple utensils. Dishwasher safe for easy cleanup.',
    'Functional and decorative spoon rest',
    599.00,
    NULL,
    'CSR-001',
    70,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  ),
  (
    'Ceramic Salt & Pepper Set',
    'ceramic-salt-pepper-set',
    'Elegant ceramic salt and pepper shakers with bamboo tops. Airtight to keep spices fresh. Modern minimalist design fits any kitchen aesthetic.',
    'Premium salt and pepper shaker set',
    799.00,
    1099.00,
    'CSPS-002',
    62,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  ),
  (
    'Ceramic Mortar & Pestle',
    'ceramic-mortar-pestle',
    'Traditional ceramic mortar and pestle for grinding spices, herbs, and making pastes. Large 5-inch diameter bowl. Non-porous surface won''t absorb flavors.',
    'Professional mortar and pestle set',
    1599.00,
    2199.00,
    'CMP-002',
    38,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  ),
  (
    'Ceramic Measuring Cups',
    'ceramic-measuring-cups',
    'Set of 4 ceramic measuring cups with handles. Includes 1 cup, 1/2 cup, 1/3 cup, and 1/4 cup sizes. Engraved measurements won''t fade or wear off.',
    'Set of 4 durable measuring cups',
    1299.00,
    NULL,
    'CMC-001',
    45,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  ),
  (
    'Ceramic Cooking Spoons Set',
    'ceramic-cooking-spoons-set',
    'Set of 3 ceramic cooking spoons in different sizes. Won''t scratch non-stick surfaces. Heat-resistant up to 400°F. Beautiful enough to serve with.',
    'Set of 3 essential cooking spoons',
    999.00,
    1499.00,
    'CCSS-001',
    52,
    (SELECT id FROM public.categories WHERE slug = 'kitchen-tools'),
    true,
    false
  );

-- Insert placeholder images for all new products
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT 
  id,
  '/placeholder.svg?height=600&width=600&query=' || name,
  name,
  1,
  true
FROM public.products
WHERE id NOT IN (SELECT DISTINCT product_id FROM public.product_images);
