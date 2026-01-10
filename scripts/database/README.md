# Database Scripts

This folder contains database-related scripts for the Uyarvom e-commerce platform.

## SQL Scripts (Supabase)

- `001_create_tables.sql` - Initial table creation
- `002_enable_rls.sql` - Row Level Security setup
- `003_create_functions.sql` - Database functions
- `004_seed_data.sql` - Initial seed data
- `005_add_more_products.sql` - Additional product data
- `006_fix_rls_policies.sql` - RLS policy fixes
- `007_add_product_images.sql` - Product image data

## Usage

These scripts are primarily for Supabase setup. For local development with Prisma, use:

```bash
npm run db:migrate
npm run db:seed
```