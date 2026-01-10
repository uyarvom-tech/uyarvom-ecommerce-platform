-- Add realistic mock images for all products with specific ceramic product queries

-- Cookware images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dutch Oven - Front View', 1, true
FROM public.products WHERE slug = 'ceramic-dutch-oven';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Skillet - Top View', 1, true
FROM public.products WHERE slug = 'ceramic-skillet';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Saucepan - Lifestyle', 1, true
FROM public.products WHERE slug = 'ceramic-saucepan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Wok Pan - Front View', 1, true
FROM public.products WHERE slug = 'ceramic-wok-pan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Stock Pot - With Lid', 1, true
FROM public.products WHERE slug = 'ceramic-stock-pot';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Grill Pan - Top View', 1, true
FROM public.products WHERE slug = 'ceramic-grill-pan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Skillet Set - Complete Set', 1, true
FROM public.products WHERE slug = 'ceramic-skillet-set';

-- Bakeware images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Baking Dish - Empty', 1, true
FROM public.products WHERE slug = 'ceramic-baking-dish';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Casserole Dish - Front View', 1, true
FROM public.products WHERE slug = 'ceramic-casserole-dish';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Loaf Pan - Side View', 1, true
FROM public.products WHERE slug = 'ceramic-loaf-pan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Pie Dish - Top View', 1, true
FROM public.products WHERE slug = 'ceramic-pie-dish';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Muffin Pan - Empty', 1, true
FROM public.products WHERE slug = 'ceramic-muffin-pan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Roasting Pan - Front View', 1, true
FROM public.products WHERE slug = 'ceramic-roasting-pan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Tart Pan - Top View', 1, true
FROM public.products WHERE slug = 'ceramic-tart-pan';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Ramekin Set - Six Pieces', 1, true
FROM public.products WHERE slug = 'ceramic-ramekin-set';

-- Dinnerware images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dinner Plates - Set of Six', 1, true
FROM public.products WHERE slug = 'ceramic-dinner-plates';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Serving Platter - Top View', 1, true
FROM public.products WHERE slug = 'ceramic-serving-platter';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Bowl Set - Six Bowls', 1, true
FROM public.products WHERE slug = 'ceramic-bowl-set';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Mug Set - Four Mugs', 1, true
FROM public.products WHERE slug = 'ceramic-mug-set';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Salad Plates - Set of Six', 1, true
FROM public.products WHERE slug = 'ceramic-salad-plates-set';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dinner Set - Complete 24 Pieces', 1, true
FROM public.products WHERE slug = 'ceramic-dinner-set';

-- Kitchen Tools images
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Mixing Bowls - Set of Three', 1, true
FROM public.products WHERE slug = 'ceramic-mixing-bowls';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Utensil Holder - Front View', 1, true
FROM public.products WHERE slug = 'ceramic-utensil-holder';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Spoon Rest - Top View', 1, true
FROM public.products WHERE slug = 'ceramic-spoon-rest';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Salt & Pepper Set - Pair', 1, true
FROM public.products WHERE slug = 'ceramic-salt-pepper-set';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Mortar & Pestle - Set', 1, true
FROM public.products WHERE slug = 'ceramic-mortar-pestle';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Measuring Cups - Set of Four', 1, true
FROM public.products WHERE slug = 'ceramic-measuring-cups';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Cooking Spoons - Set of Three', 1, true
FROM public.products WHERE slug = 'ceramic-cooking-spoons-set';

-- Add secondary lifestyle images for featured products
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dutch Oven - In Use', 2, false
FROM public.products WHERE slug = 'ceramic-dutch-oven';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Skillet - Cooking Eggs', 2, false
FROM public.products WHERE slug = 'ceramic-skillet';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Baking Dish - Fresh from Oven', 2, false
FROM public.products WHERE slug = 'ceramic-baking-dish';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dinner Plates - Table Setting', 2, false
FROM public.products WHERE slug = 'ceramic-dinner-plates';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Pie Dish - Fresh Baked Pie', 2, false
FROM public.products WHERE slug = 'ceramic-pie-dish';

-- Add detail/angle shots for premium products
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dutch Oven - Handle Detail', 3, false
FROM public.products WHERE slug = 'ceramic-dutch-oven';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Skillet - Surface Detail', 3, false
FROM public.products WHERE slug = 'ceramic-skillet';

INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT id, '/placeholder.svg?height=800&width=800', 'Ceramic Dinner Plates - Finish Detail', 3, false
FROM public.products WHERE slug = 'ceramic-dinner-plates';
