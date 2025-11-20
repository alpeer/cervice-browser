/** @type {import('next').NextConfig} */
const nextConfig = {
  // Acknowledge Turbopack usage
  turbopack: {},

  // Disable CSS optimization in development
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig
