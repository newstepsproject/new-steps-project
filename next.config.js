console.log('DEBUG: NEXTAUTH_URL at build time:', process.env.NEXTAUTH_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed output: 'standalone' to fix routing issues
  
  // External packages for server components (moved from experimental in Next.js 15)
  serverExternalPackages: ['mongoose'],
  
  // Mobile Performance Optimizations
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
      },
    ],
    // Mobile-optimized image settings with moderate caching for frequent updates
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: process.env.NODE_ENV === 'development' ? 60 : 3600, // 1 minute in dev, 1 hour in production
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  env: {
    NEXT_PUBLIC_CLOUDFRONT_URL: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  experimental: {
    // Mobile performance optimizations - disabled optimizeCss due to build issues
    // optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // ZERO CACHE POLICY - No caching in development OR production for immediate updates
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: process.env.NODE_ENV === 'development' 
            ? 'no-cache, no-store, must-revalidate' 
            : 'public, max-age=900, s-maxage=900', // 15 minutes in production
        },
      ],
    },
    // ZERO CACHE for admin routes
    {
      source: '/admin/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
        {
          key: 'Expires',
          value: '0',
        },
      ],
    },
    // ZERO CACHE for API routes  
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
  ],
  
  // Compression and Performance
  compress: true,
  poweredByHeader: false,
  
  // Bundle Analysis (disabled in production)
  webpack: (config, { dev, isServer }) => {
    // Enable code splitting and tree shaking for mobile
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // TypeScript and ESLint (keep existing settings)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Performance settings with development-friendly caching
  staticPageGenerationTimeout: 1000,
  generateEtags: process.env.NODE_ENV !== 'development', // Disable ETags in development
}

module.exports = nextConfig; 