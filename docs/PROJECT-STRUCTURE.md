# Project Structure

## Overview

Clean, organized structure for the Uyarvom e-commerce platform.

```
uyarvom-ecommerce-platform/
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── docs/                   # Project documentation
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets and uploads
├── scripts/                # Database and maintenance scripts
│   ├── database/          # SQL scripts for Supabase setup
│   └── maintenance/       # Backup and data management scripts
├── styles/                 # Global CSS styles
├── .env.example           # Environment variables template
├── .env.local             # Local environment variables (gitignored)
├── .gitignore             # Git ignore rules
├── components.json        # Radix UI configuration
├── middleware.ts          # Next.js middleware
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies and scripts
├── postcss.config.mjs     # PostCSS configuration
├── README.md              # Quick start guide
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Key Features

- **Clean Structure**: Organized folders with clear purposes
- **Documentation**: Comprehensive docs in `/docs` folder
- **Scripts Organization**: Database and maintenance scripts properly categorized
- **Environment Management**: Proper .env file structure
- **Development Ready**: All necessary configuration files present

## Removed During Cleanup

- Multiple redundant deployment guides
- Test and verification scripts
- Backup system folder (consolidated into scripts/maintenance)
- Unnecessary configuration files
- Build artifacts and temporary files

## Next Steps

1. Set up environment variables in `.env.local`
2. Run database migrations: `npm run db:migrate`
3. Start development: `npm run dev`
4. Access admin panel with: `admin@uyarvom.com` / `admin123`