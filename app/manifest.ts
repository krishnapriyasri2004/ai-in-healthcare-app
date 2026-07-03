import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Medical Anatomy AI',
    short_name: 'Anatomy AI',
    description: 'Interactive 3D medical anatomy visualization with AI symptom analysis',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
