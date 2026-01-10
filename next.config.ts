import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force webpack usage instead of turbopack to avoid compatibility issues
  // Use --webpack flag in build command instead of experimental config
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'green-useful-eagle-967.mypinata.cloud',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
  
  webpack: (config, { isServer }) => {
    // Exclude test files and problematic modules from bundling
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      },
    };
    
    // Ignore problematic files from node_modules
    config.module.rules.push({
      test: /node_modules\/thread-stream\/(test|bench).*\.(js|mjs|ts)$/,
      use: 'null-loader',
    });

    config.module.rules.push({
      test: /node_modules\/thread-stream\/(README\.md|LICENSE)$/,
      use: 'null-loader',
    });
    
    return config;
  },
  transpilePackages: ['panna-sdk', 'thirdweb'],
};

export default nextConfig;
