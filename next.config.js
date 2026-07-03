/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev server to be accessed from other devices on the LAN
  // This eliminates the "Blocked cross-origin request" warning
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
}
module.exports = nextConfig
