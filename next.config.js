/**
 * Next.js configuration for FitLife.
 * Nothing exotic here: React strict mode is on for better dev warnings,
 * and images.domains is left open for exercise thumbnails/videos that may
 * be hosted on Firebase Storage or any CDN the admin uploads to.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

module.exports = nextConfig;
