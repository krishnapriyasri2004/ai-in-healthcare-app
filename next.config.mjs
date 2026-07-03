/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/ai-in-healthcare',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
