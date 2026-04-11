/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  devIndicators: {
    buildActivity: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ["@supabase/auth-js", "@supabase/supabase-js", "@supabase/ssr"],
  images: {
    // Skip optimization in local dev to avoid timeout fetching remote images
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    loader: 'default',
  },
  // Vercel deployment optimizations
  output: 'standalone',
}

export default nextConfig
