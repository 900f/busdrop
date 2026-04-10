/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.fortniteapi.io' },
      { protocol: 'https', hostname: 'fortnite-api.com' },
      { protocol: 'https', hostname: 'cdn2.unrealengine.com' },
    ],
  },
}
module.exports = nextConfig
