export interface SubCategory {
  id: string
  name: string
  slug: string
  href: string
}

export interface CategoryGroup {
  id: string
  title: string
  subcategories: SubCategory[]
}

export interface NavigationCategory {
  id: string
  name: string
  slug: string
  icon: string
  href: string
  groups: CategoryGroup[]
}

export const navigationCategories: NavigationCategory[] = [
  {
    id: 'sale',
    name: 'Sale',
    slug: 'sale',
    icon: '/category-icons/sale.png',
    href: '/?category=sale',
    groups: [
      {
        id: 'kitchen-sale',
        title: 'Kitchen Sale',
        subcategories: [
          { id: 'cookware-sale', name: 'Cookware', slug: 'cookware-sale', href: '/?category=cookware&sale=true' },
          { id: 'dinnerware-sale', name: 'Dinnerware', slug: 'dinnerware-sale', href: '/?category=dinnerware&sale=true' },
          { id: 'serveware-sale', name: 'Serveware', slug: 'serveware-sale', href: '/?category=serveware&sale=true' },
        ]
      },
      {
        id: 'home-sale',
        title: 'Home Decor Sale',
        subcategories: [
          { id: 'vases-sale', name: 'Vases', slug: 'vases-sale', href: '/?category=vases&sale=true' },
          { id: 'planters-sale', name: 'Planters', slug: 'planters-sale', href: '/?category=planters&sale=true' },
          { id: 'candles-sale', name: 'Candles', slug: 'candles-sale', href: '/?category=candles&sale=true' },
        ]
      }
    ]
  },
  {
    id: 'living-room',
    name: 'Living Room',
    slug: 'living-room',
    icon: '/category-icons/living-room.png',
    href: '/?category=living-room',
    groups: [
      {
        id: 'seating',
        title: 'Seating',
        subcategories: [
          { id: 'sofas', name: 'Sofas', slug: 'sofas', href: '/?category=sofas' },
          { id: 'chairs', name: 'Chairs', slug: 'chairs', href: '/?category=chairs' },
          { id: 'ottomans', name: 'Ottomans', slug: 'ottomans', href: '/?category=ottomans' },
        ]
      },
      {
        id: 'tables',
        title: 'Tables',
        subcategories: [
          { id: 'coffee-tables', name: 'Coffee Tables', slug: 'coffee-tables', href: '/?category=coffee-tables' },
          { id: 'side-tables', name: 'Side Tables', slug: 'side-tables', href: '/?category=side-tables' },
          { id: 'console-tables', name: 'Console Tables', slug: 'console-tables', href: '/?category=console-tables' },
        ]
      },
      {
        id: 'storage',
        title: 'Storage',
        subcategories: [
          { id: 'tv-units', name: 'TV Units', slug: 'tv-units', href: '/?category=tv-units' },
          { id: 'bookshelves', name: 'Bookshelves', slug: 'bookshelves', href: '/?category=bookshelves' },
          { id: 'cabinets', name: 'Cabinets', slug: 'cabinets', href: '/?category=cabinets' },
        ]
      }
    ]
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    slug: 'bedroom',
    icon: '/category-icons/bedroom.png',
    href: '/?category=bedroom',
    groups: [
      {
        id: 'beds',
        title: 'Beds',
        subcategories: [
          { id: 'king-beds', name: 'King Beds', slug: 'king-beds', href: '/?category=king-beds' },
          { id: 'queen-beds', name: 'Queen Beds', slug: 'queen-beds', href: '/?category=queen-beds' },
          { id: 'single-beds', name: 'Single Beds', slug: 'single-beds', href: '/?category=single-beds' },
          { id: 'bunk-beds', name: 'Bunk Beds', slug: 'bunk-beds', href: '/?category=bunk-beds' },
        ]
      },
      {
        id: 'wardrobes',
        title: 'Wardrobes',
        subcategories: [
          { id: '2-door', name: '2 Door', slug: '2-door-wardrobes', href: '/?category=2-door-wardrobes' },
          { id: '3-door', name: '3 Door', slug: '3-door-wardrobes', href: '/?category=3-door-wardrobes' },
          { id: 'sliding', name: 'Sliding', slug: 'sliding-wardrobes', href: '/?category=sliding-wardrobes' },
          { id: 'walk-in', name: 'Walk-in', slug: 'walk-in-wardrobes', href: '/?category=walk-in-wardrobes' },
        ]
      },
      {
        id: 'mattresses',
        title: 'Mattresses',
        subcategories: [
          { id: 'king-mattresses', name: 'King', slug: 'king-mattresses', href: '/?category=king-mattresses' },
          { id: 'queen-mattresses', name: 'Queen', slug: 'queen-mattresses', href: '/?category=queen-mattresses' },
          { id: 'single-mattresses', name: 'Single', slug: 'single-mattresses', href: '/?category=single-mattresses' },
        ]
      },
      {
        id: 'bedroom-storage',
        title: 'Storage',
        subcategories: [
          { id: 'bed-side-tables', name: 'Bed Side Tables', slug: 'bed-side-tables', href: '/?category=bed-side-tables' },
          { id: 'chest-of-drawers', name: 'Chest of Drawers', slug: 'chest-of-drawers', href: '/?category=chest-of-drawers' },
          { id: 'dresser-mirrors', name: 'Dresser Mirrors', slug: 'dresser-mirrors', href: '/?category=dresser-mirrors' },
        ]
      }
    ]
  },
  {
    id: 'dining',
    name: 'Dining',
    slug: 'dining',
    icon: '/category-icons/dining.png',
    href: '/?category=dining',
    groups: [
      {
        id: 'dining-sets',
        title: 'Dining Sets',
        subcategories: [
          { id: '2-seater', name: '2 Seater', slug: '2-seater-dining', href: '/?category=2-seater-dining' },
          { id: '4-seater', name: '4 Seater', slug: '4-seater-dining', href: '/?category=4-seater-dining' },
          { id: '6-seater', name: '6 Seater', slug: '6-seater-dining', href: '/?category=6-seater-dining' },
          { id: '8-seater', name: '8 Seater', slug: '8-seater-dining', href: '/?category=8-seater-dining' },
        ]
      },
      {
        id: 'dining-tables',
        title: 'Dining Tables',
        subcategories: [
          { id: 'round-tables', name: 'Round Tables', slug: 'round-dining-tables', href: '/?category=round-dining-tables' },
          { id: 'rectangular-tables', name: 'Rectangular', slug: 'rectangular-dining-tables', href: '/?category=rectangular-dining-tables' },
          { id: 'extendable-tables', name: 'Extendable', slug: 'extendable-dining-tables', href: '/?category=extendable-dining-tables' },
        ]
      },
      {
        id: 'dining-chairs',
        title: 'Dining Chairs',
        subcategories: [
          { id: 'upholstered-chairs', name: 'Upholstered', slug: 'upholstered-dining-chairs', href: '/?category=upholstered-dining-chairs' },
          { id: 'wooden-chairs', name: 'Wooden', slug: 'wooden-dining-chairs', href: '/?category=wooden-dining-chairs' },
          { id: 'bar-stools', name: 'Bar Stools', slug: 'bar-stools', href: '/?category=bar-stools' },
        ]
      }
    ]
  },
  {
    id: 'decor',
    name: 'Decor',
    slug: 'decor',
    icon: '/category-icons/decor.png',
    href: '/?category=decor',
    groups: [
      {
        id: 'wall-decor',
        title: 'Wall Decor',
        subcategories: [
          { id: 'wall-art', name: 'Wall Art', slug: 'wall-art', href: '/?category=wall-art' },
          { id: 'mirrors', name: 'Mirrors', slug: 'mirrors', href: '/?category=mirrors' },
          { id: 'wall-shelves', name: 'Wall Shelves', slug: 'wall-shelves', href: '/?category=wall-shelves' },
        ]
      },
      {
        id: 'decorative-objects',
        title: 'Decorative Objects',
        subcategories: [
          { id: 'vases', name: 'Vases', slug: 'vases', href: '/?category=vases' },
          { id: 'sculptures', name: 'Sculptures', slug: 'sculptures', href: '/?category=sculptures' },
          { id: 'figurines', name: 'Figurines', slug: 'figurines', href: '/?category=figurines' },
        ]
      },
      {
        id: 'lighting',
        title: 'Lighting',
        subcategories: [
          { id: 'table-lamps', name: 'Table Lamps', slug: 'table-lamps', href: '/?category=table-lamps' },
          { id: 'floor-lamps', name: 'Floor Lamps', slug: 'floor-lamps', href: '/?category=floor-lamps' },
          { id: 'candles', name: 'Candles', slug: 'candles', href: '/?category=candles' },
        ]
      }
    ]
  },
  {
    id: 'organisers',
    name: 'Organisers',
    slug: 'organisers',
    icon: '/category-icons/organisers.png',
    href: '/?category=organisers',
    groups: [
      {
        id: 'kitchen-organisers',
        title: 'Kitchen Organisers',
        subcategories: [
          { id: 'spice-racks', name: 'Spice Racks', slug: 'spice-racks', href: '/?category=spice-racks' },
          { id: 'pantry-organisers', name: 'Pantry Organisers', slug: 'pantry-organisers', href: '/?category=pantry-organisers' },
          { id: 'drawer-organisers', name: 'Drawer Organisers', slug: 'drawer-organisers', href: '/?category=drawer-organisers' },
        ]
      },
      {
        id: 'closet-organisers',
        title: 'Closet Organisers',
        subcategories: [
          { id: 'hangers', name: 'Hangers', slug: 'hangers', href: '/?category=hangers' },
          { id: 'shoe-racks', name: 'Shoe Racks', slug: 'shoe-racks', href: '/?category=shoe-racks' },
          { id: 'storage-boxes', name: 'Storage Boxes', slug: 'storage-boxes', href: '/?category=storage-boxes' },
        ]
      }
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    slug: 'kitchen',
    icon: '/category-icons/kitchen.png',
    href: '/?category=kitchen',
    groups: [
      {
        id: 'cookware',
        title: 'Cookware',
        subcategories: [
          { id: 'pots-pans', name: 'Pots & Pans', slug: 'pots-pans', href: '/?category=pots-pans' },
          { id: 'skillets', name: 'Skillets', slug: 'skillets', href: '/?category=skillets' },
          { id: 'dutch-ovens', name: 'Dutch Ovens', slug: 'dutch-ovens', href: '/?category=dutch-ovens' },
          { id: 'woks', name: 'Woks', slug: 'woks', href: '/?category=woks' },
        ]
      },
      {
        id: 'bakeware',
        title: 'Bakeware',
        subcategories: [
          { id: 'baking-dishes', name: 'Baking Dishes', slug: 'baking-dishes', href: '/?category=baking-dishes' },
          { id: 'cake-pans', name: 'Cake Pans', slug: 'cake-pans', href: '/?category=cake-pans' },
          { id: 'muffin-tins', name: 'Muffin Tins', slug: 'muffin-tins', href: '/?category=muffin-tins' },
        ]
      },
      {
        id: 'kitchen-tools',
        title: 'Kitchen Tools',
        subcategories: [
          { id: 'utensils', name: 'Utensils', slug: 'utensils', href: '/?category=utensils' },
          { id: 'cutting-boards', name: 'Cutting Boards', slug: 'cutting-boards', href: '/?category=cutting-boards' },
          { id: 'measuring-tools', name: 'Measuring Tools', slug: 'measuring-tools', href: '/?category=measuring-tools' },
        ]
      }
    ]
  },
  {
    id: 'tableware',
    name: 'Tableware',
    slug: 'tableware',
    icon: '/category-icons/tableware.png',
    href: '/?category=tableware',
    groups: [
      {
        id: 'dinnerware',
        title: 'Dinnerware',
        subcategories: [
          { id: 'dinner-plates', name: 'Dinner Plates', slug: 'dinner-plates', href: '/?category=dinner-plates' },
          { id: 'bowls', name: 'Bowls', slug: 'bowls', href: '/?category=bowls' },
          { id: 'mugs-cups', name: 'Mugs & Cups', slug: 'mugs-cups', href: '/?category=mugs-cups' },
          { id: 'dinner-sets', name: 'Dinner Sets', slug: 'dinner-sets', href: '/?category=dinner-sets' },
        ]
      },
      {
        id: 'serveware',
        title: 'Serveware',
        subcategories: [
          { id: 'serving-platters', name: 'Serving Platters', slug: 'serving-platters', href: '/?category=serving-platters' },
          { id: 'serving-bowls', name: 'Serving Bowls', slug: 'serving-bowls', href: '/?category=serving-bowls' },
          { id: 'gravy-boats', name: 'Gravy Boats', slug: 'gravy-boats', href: '/?category=gravy-boats' },
        ]
      },
      {
        id: 'drinkware',
        title: 'Drinkware',
        subcategories: [
          { id: 'wine-glasses', name: 'Wine Glasses', slug: 'wine-glasses', href: '/?category=wine-glasses' },
          { id: 'water-glasses', name: 'Water Glasses', slug: 'water-glasses', href: '/?category=water-glasses' },
          { id: 'tea-sets', name: 'Tea Sets', slug: 'tea-sets', href: '/?category=tea-sets' },
        ]
      }
    ]
  },
  {
    id: 'bath-laundry',
    name: 'Bath & Laundry',
    slug: 'bath-laundry',
    icon: '/category-icons/bath-laundry.png',
    href: '/?category=bath-laundry',
    groups: [
      {
        id: 'bath-accessories',
        title: 'Bath Accessories',
        subcategories: [
          { id: 'towels', name: 'Towels', slug: 'towels', href: '/?category=towels' },
          { id: 'bath-mats', name: 'Bath Mats', slug: 'bath-mats', href: '/?category=bath-mats' },
          { id: 'shower-curtains', name: 'Shower Curtains', slug: 'shower-curtains', href: '/?category=shower-curtains' },
        ]
      },
      {
        id: 'laundry',
        title: 'Laundry',
        subcategories: [
          { id: 'laundry-baskets', name: 'Laundry Baskets', slug: 'laundry-baskets', href: '/?category=laundry-baskets' },
          { id: 'drying-racks', name: 'Drying Racks', slug: 'drying-racks', href: '/?category=drying-racks' },
          { id: 'ironing-boards', name: 'Ironing Boards', slug: 'ironing-boards', href: '/?category=ironing-boards' },
        ]
      }
    ]
  },
  {
    id: 'gifting',
    name: 'Gifting',
    slug: 'gifting',
    icon: '/category-icons/gifting.png',
    href: '/?category=gifting',
    groups: [
      {
        id: 'gift-sets',
        title: 'Gift Sets',
        subcategories: [
          { id: 'housewarming-gifts', name: 'Housewarming Gifts', slug: 'housewarming-gifts', href: '/?category=housewarming-gifts' },
          { id: 'wedding-gifts', name: 'Wedding Gifts', slug: 'wedding-gifts', href: '/?category=wedding-gifts' },
          { id: 'corporate-gifts', name: 'Corporate Gifts', slug: 'corporate-gifts', href: '/?category=corporate-gifts' },
        ]
      },
      {
        id: 'gift-cards',
        title: 'Gift Cards',
        subcategories: [
          { id: 'digital-gift-cards', name: 'Digital Gift Cards', slug: 'digital-gift-cards', href: '/?category=digital-gift-cards' },
          { id: 'physical-gift-cards', name: 'Physical Gift Cards', slug: 'physical-gift-cards', href: '/?category=physical-gift-cards' },
        ]
      }
    ]
  }
]