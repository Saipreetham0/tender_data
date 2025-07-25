// next.config.js
const nextConfig = {
  reactStrictMode: false,
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
    // Skip building the admin cron page to avoid serialization issues
    staticPageGenerationTimeout: 60,
    outputFileTracingIgnores: ['**/admin/cron/**'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Add more patterns if needed
    ],
  },
};

module.exports = nextConfig;
