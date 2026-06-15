/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.telegram.org' },
      { protocol: 'https', hostname: 'ldlppnavezugvkskvlab.supabase.co' },
    ],
  },
}

module.exports = nextConfig
