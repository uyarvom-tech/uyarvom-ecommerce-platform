// Demo data for development when Supabase is not configured
// Using static timestamps to prevent hydration mismatches
const DEMO_TIMESTAMP = "2024-01-01T00:00:00.000Z"

export const demoCategories = [
  {
    id: "1",
    name: "Cookware",
    slug: "cookware",
    description: "Premium ceramic pots, pans, and cooking essentials",
    image_url: "/Cookware.png",
    parent_id: null,
    display_order: 1,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP
  },
  {
    id: "2", 
    name: "Dinnerware",
    slug: "dinnerware",
    description: "Beautiful plates, bowls, and serving pieces",
    image_url: "/Dinnerware.png",
    parent_id: null,
    display_order: 2,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP
  },
  {
    id: "3",
    name: "Bakeware", 
    slug: "bakeware",
    description: "Ceramic baking dishes and accessories",
    image_url: "/Bakeware.png",
    parent_id: null,
    display_order: 3,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP
  },
  {
    id: "4",
    name: "Serveware",
    slug: "serveware", 
    description: "Elegant serving bowls and platters",
    image_url: "/Serveware.png",
    parent_id: null,
    display_order: 4,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP
  }
]

export const demoProducts = [
  {
    id: "1",
    name: "Artisan Ceramic Cooking Pot",
    slug: "artisan-ceramic-cooking-pot",
    description: "Handcrafted ceramic cooking pot perfect for slow cooking and braising. Made from premium clay with a beautiful glazed finish that retains heat evenly and adds rich flavors to your dishes. This versatile pot is ideal for stews, soups, and one-pot meals.",
    short_description: "Premium handcrafted ceramic cooking pot with glazed finish",
    price: 2499,
    compare_at_price: 3199,
    cost_per_item: 1200,
    sku: "UYV-CP-001",
    barcode: "1234567890123",
    track_inventory: true,
    stock_quantity: 25,
    low_stock_threshold: 5,
    weight: 2.5,
    weight_unit: "kg",
    category_id: "1",
    is_active: true,
    is_featured: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
    category: {
      name: "Cookware",
      slug: "cookware"
    },
    images: [
      {
        image_url: "/Artisan_Ceramic_Cooking_Pot.png",
        alt_text: "Artisan Ceramic Cooking Pot - Main View",
        is_primary: true
      },
      {
        image_url: "/ceramic-pottery-workshop-artisan-crafting.jpg",
        alt_text: "Artisan Ceramic Cooking Pot - Crafting Process",
        is_primary: false
      }
    ]
  },
  {
    id: "2", 
    name: "Elegant Dinner Plate Set",
    slug: "elegant-dinner-plate-set",
    description: "Set of 4 beautifully crafted ceramic dinner plates. Perfect for everyday dining or special occasions. Each plate features a smooth, non-porous surface that's easy to clean and dishwasher safe. The elegant design complements any table setting.",
    short_description: "Set of 4 handcrafted ceramic dinner plates",
    price: 1899,
    compare_at_price: null,
    cost_per_item: 800,
    sku: "UYV-DP-002",
    barcode: "1234567890124", 
    track_inventory: true,
    stock_quantity: 15,
    low_stock_threshold: 3,
    weight: 1.8,
    weight_unit: "kg",
    category_id: "2",
    is_active: true,
    is_featured: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
    category: {
      name: "Dinnerware",
      slug: "dinnerware"
    },
    images: [
      {
        image_url: "/Elegant_Dinner_Plate_Set.png",
        alt_text: "Elegant Dinner Plate Set - Main View",
        is_primary: true
      },
      {
        image_url: "/ceramic-pottery-workshop-artisan-crafting.jpg",
        alt_text: "Elegant Dinner Plate Set - Artisan Crafting",
        is_primary: false
      }
    ]
  },
  {
    id: "3",
    name: "Ceramic Baking Dish",
    slug: "ceramic-baking-dish", 
    description: "Large ceramic baking dish ideal for casseroles, roasts, and baked goods. Even heat distribution for perfect results every time. The deep design allows for generous portions while the handles provide a secure grip when transferring from oven to table.",
    short_description: "Large ceramic baking dish for casseroles and roasts",
    price: 1599,
    compare_at_price: 1999,
    cost_per_item: 700,
    sku: "UYV-BD-003",
    barcode: "1234567890125",
    track_inventory: true,
    stock_quantity: 8,
    low_stock_threshold: 5,
    weight: 2.2,
    weight_unit: "kg", 
    category_id: "3",
    is_active: true,
    is_featured: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
    category: {
      name: "Bakeware",
      slug: "bakeware"
    },
    images: [
      {
        image_url: "/Baking_Dish.png",
        alt_text: "Ceramic Baking Dish - Main View",
        is_primary: true
      },
      {
        image_url: "/ceramic-cookware-in-modern-kitchen.jpg",
        alt_text: "Ceramic Baking Dish - Kitchen Setting",
        is_primary: false
      }
    ]
  },
  {
    id: "4",
    name: "Handmade Ceramic Bowl Set",
    slug: "handmade-ceramic-bowl-set",
    description: "Set of 6 handmade ceramic bowls in varying sizes. Perfect for serving soups, salads, cereals, and snacks. Each bowl is unique with subtle variations that showcase the artisan's craftsmanship. Microwave and dishwasher safe.",
    short_description: "Set of 6 handmade ceramic bowls in different sizes",
    price: 2199,
    compare_at_price: 2799,
    cost_per_item: 900,
    sku: "UYV-BS-004",
    barcode: "1234567890126",
    track_inventory: true,
    stock_quantity: 12,
    low_stock_threshold: 3,
    weight: 1.5,
    weight_unit: "kg",
    category_id: "2",
    is_active: true,
    is_featured: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
    category: {
      name: "Dinnerware",
      slug: "dinnerware"
    },
    images: [
      {
        image_url: "/bowls.png",
        alt_text: "Handmade Ceramic Bowl Set - Main View",
        is_primary: true
      },
      {
        image_url: "/ceramic-pottery-workshop-artisan-crafting.jpg",
        alt_text: "Handmade Ceramic Bowl Set - Artisan Workshop",
        is_primary: false
      }
    ]
  },
  {
    id: "5",
    name: "Ceramic Tea Set",
    slug: "ceramic-tea-set",
    description: "Complete ceramic tea set including teapot, 4 cups, and serving tray. Beautifully glazed with a traditional yet modern design. The teapot features an ergonomic handle and precision spout for perfect pouring. Ideal for afternoon tea or entertaining guests.",
    short_description: "Complete ceramic tea set with teapot, cups, and tray",
    price: 3299,
    compare_at_price: 3999,
    cost_per_item: 1500,
    sku: "UYV-TS-005",
    barcode: "1234567890127",
    track_inventory: true,
    stock_quantity: 6,
    low_stock_threshold: 2,
    weight: 3.0,
    weight_unit: "kg",
    category_id: "4",
    is_active: true,
    is_featured: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
    category: {
      name: "Serveware",
      slug: "serveware"
    },
    images: [
      {
        image_url: "/tea_pot.png",
        alt_text: "Ceramic Tea Set - Main View",
        is_primary: true
      },
      {
        image_url: "/ceramic-pottery-workshop-artisan-crafting.jpg",
        alt_text: "Ceramic Tea Set - Artisan Crafting",
        is_primary: false
      }
    ]
  },
  {
    id: "6",
    name: "Rustic Ceramic Platter",
    slug: "rustic-ceramic-platter",
    description: "Large rustic ceramic serving platter perfect for entertaining. The organic shape and earthy glaze give it a natural, artisanal look. Ideal for serving appetizers, cheese boards, or as a decorative centerpiece. Each piece has unique characteristics.",
    short_description: "Large rustic ceramic serving platter for entertaining",
    price: 1799,
    compare_at_price: null,
    cost_per_item: 800,
    sku: "UYV-PL-006",
    barcode: "1234567890128",
    track_inventory: true,
    stock_quantity: 18,
    low_stock_threshold: 4,
    weight: 1.8,
    weight_unit: "kg",
    category_id: "4",
    is_active: true,
    is_featured: false,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
    category: {
      name: "Serveware",
      slug: "serveware"
    },
    images: [
      {
        image_url: "/Ceramic_Platter.png",
        alt_text: "Rustic Ceramic Platter - Main View",
        is_primary: true
      },
      {
        image_url: "/ceramic-cookware-in-modern-kitchen.jpg",
        alt_text: "Rustic Ceramic Platter - Kitchen Display",
        is_primary: false
      }
    ]
  }
]