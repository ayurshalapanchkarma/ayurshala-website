/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
  serverExternalPackages: [
    '@sparticuz/chromium',
    'puppeteer-core',
  ],

  // Webpack configuration to explicitly externalize packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add regex patterns for externals
      const externals = config.externals || []
      config.externals = [
        ...externals,
        /^@sparticuz\/chromium/,
        /^puppeteer-core/,
      ]
    }
    return config
  },

  // Empty turbopack config to allow build to proceed
  turbopack: {},

  // Content Security Policy headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;",
          },
        ],
      },
    ]
  },
}
module.exports = nextConfig
