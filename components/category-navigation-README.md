# Category Navigation System

A Home Centre-style category navigation component for the Uyarvom e-commerce platform.

## Features

✅ **Circular Category Icons**: Premium circular icons with emoji fallbacks
✅ **Mega Dropdown**: Multi-column grid layout with subcategories
✅ **Responsive Design**: Desktop hover, mobile tap interactions
✅ **Smooth Animations**: 300ms ease transitions with staggered animations
✅ **Keyboard Navigation**: ESC to close, click-outside support
✅ **Mobile Bottom Sheet**: Native mobile experience
✅ **Data-Driven**: Easy to extend with new categories

## Usage

```tsx
import { CategoryNavigation } from '@/components/category-navigation'

export default function HomePage() {
  return (
    <div>
      <Header />
      <CategoryNavigation />
      <main>
        {/* Your content */}
      </main>
    </div>
  )
}
```

## Configuration

Edit `/lib/category-navigation-data.ts` to add/modify categories:

```typescript
export const navigationCategories: NavigationCategory[] = [
  {
    id: 'new-category',
    name: 'New Category',
    slug: 'new-category',
    icon: '/category-icons/new-category.png', // Optional
    href: '/?category=new-category',
    groups: [
      {
        id: 'group-1',
        title: 'Group Title',
        subcategories: [
          { 
            id: 'sub-1', 
            name: 'Subcategory', 
            slug: 'subcategory', 
            href: '/?category=subcategory' 
          }
        ]
      }
    ]
  }
]
```

## Styling

The component uses Uyarvom's gold/amber theme:
- Primary: `amber-600` to `amber-700`
- Hover states: `amber-100` to `amber-200`
- Active states: `amber-400` indicators
- Smooth transitions and hover effects

## Mobile Behavior

- **Desktop**: Hover to open dropdown, click outside to close
- **Tablet**: Tap to toggle dropdown
- **Mobile**: Bottom sheet with backdrop overlay

## Keyboard Support

- `ESC`: Close active dropdown
- Click outside: Close dropdown
- Tab navigation: Accessible focus states

## Performance

- Lazy loading of dropdown content
- Optimized animations with CSS transforms
- Minimal re-renders with proper state management

## Browser Support

- Modern browsers with CSS Grid support
- Fallback emoji icons for all devices
- Touch-friendly mobile interactions