/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Enable strict TypeScript checking for production
  },
  images: {
    unoptimized: false, // Enable Next.js image optimization
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
  // Vercel-specific optimizations
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Output configuration for Vercel
  output: 'standalone',
}

export default nextConfig
