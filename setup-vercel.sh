#!/bin/bash

echo "🚀 Setting up Uyarvom E-commerce for Vercel Deployment"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for Vercel deployment"
else
    echo "✅ Git repository already initialized"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Create a PostgreSQL database (Supabase includes one)"
echo "3. Push your code to GitHub"
echo "4. Deploy to Vercel at https://vercel.com"
echo "5. Set environment variables in Vercel dashboard:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - JWT_SECRET"
echo ""
echo "📖 See VERCEL-DEPLOYMENT.md for detailed instructions"