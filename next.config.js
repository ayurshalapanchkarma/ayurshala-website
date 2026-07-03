/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev server to be accessed from other devices on the LAN
  allowedDevOrigins: [
    '192.168.0.111',
    'localhost',
    '127.0.0.1',
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // Externalize Chromium and Puppeteer packages for serverless deployment
  // Prevents Next.js from bundling these into the server function
  // They must remain as external dependencies for @sparticuz/chromium to work correctly
  serverExternalPackages: [
    '@sparticuz/chromium',
    'puppeteer-core',
  ],
}
module.exports = nextConfig
