import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { AppProvider } from '@/components/AppContext'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Medical Anatomy AI - Interactive 3D Visualization',
  description: 'Advanced 3D medical anatomy visualization with AI-powered symptom analysis. Analyze symptoms and see which organs are affected in real-time.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-body antialiased bg-surface text-on-surface min-h-screen flex flex-col overflow-hidden">
        {/* Global Scanline Effect */}
        <div className="scanline"></div>

        {/* Top Disclaimer Banner */}
        <div className="fixed top-0 left-0 w-full z-[100] bg-blue-900/90 text-white text-center py-1.5 text-xs font-mono font-bold tracking-widest backdrop-blur-md border-b border-blue-500/50 flex justify-center items-center shadow-lg pointer-events-none">
          <span className="text-blue-200 mr-2">⚠</span> AI-generated decision support — not a diagnosis.
        </div>

        {/* Global Header */}
        <Header />

        {/* Console layout with Sidebar */}
        <AppProvider>
          <div className="flex-1 flex pt-16 h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 relative overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </div>
        </AppProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                const basePath = '/ai-in-healthcare';
                navigator.serviceWorker.register(basePath + '/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
