// next.config.js
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
    // Disable ESLint during builds (we'll run it separately)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds (we'll run it separately)
    ignoreBuildErrors: false,
  },
  experimental: {
    // Production optimizations
    optimizeCss: true,
  },
  // Improved image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.rgukt.in",
      },
      {
        protocol: "https", 
        hostname: "*.rgukt.ac.in",
      },
      {
        protocol: "https",
        hostname: "*.rguktsklm.ac.in",
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Better bundling and optimization
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Performance improvements
  poweredByHeader: false,
  compress: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
