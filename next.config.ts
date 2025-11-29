import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
