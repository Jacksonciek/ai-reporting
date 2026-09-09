/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      appDir: true,
    },
    // Disable React strict mode to avoid duplicate effects in development
    reactStrictMode: false,
  }

  module.exports = nextConfig