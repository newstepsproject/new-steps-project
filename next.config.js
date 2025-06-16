console.log('DEBUG: NEXTAUTH_URL at build time:', process.env.NEXTAUTH_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
  },
  env: {
    NEXT_PUBLIC_CLOUDFRONT_URL: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  // Disable TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Prevent static generation of pages
  staticPageGenerationTimeout: 1000,
  // Set dynamic rendering for all pages
  generateEtags: false, // Disable etag generation to prevent caching
  webpack: (config, { dev, isServer }) => {
    // Disable code minimization in webpack
    config.optimization.minimize = false;
    
    return config;
  },
}

module.exports = nextConfig 