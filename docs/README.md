# Uyarvom E-commerce Platform

A modern, full-stack e-commerce platform built with Next.js 16, TypeScript, and Prisma.

## Features

- **Product Management**: Complete product catalog with variants, images, and categories
- **Admin Dashboard**: Role-based access control for staff and administrators
- **User Authentication**: Secure authentication with Supabase
- **Order Management**: Full order processing and tracking system
- **Review System**: Customer reviews and ratings
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion, GSAP

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd uyarvom-ecommerce-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Set up the database
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start the development server
```bash
npm run dev
```

## Project Structure

```
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility functions and configurations
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── scripts/                # Database and utility scripts
├── docs/                   # Documentation
└── styles/                 # Global styles
```

## Environment Variables

Required environment variables:

- `DATABASE_URL` - Database connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_SECRET` - JWT secret for authentication

## Development

### Database Management

- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with sample data
- `npm run db:studio` - Open Prisma Studio

### Building

- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary software for Uyarvom.