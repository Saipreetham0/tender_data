// next.config.js
const nextConfig = {
  reactStrictMode: false,
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
