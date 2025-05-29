/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
  },
  images: {
    domains: ['utfs.io', 'localhost'],
  },
}

module.exports = nextConfig
