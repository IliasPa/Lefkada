import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Λευκάδα',
  description: 'Δημοτική εφαρμογή Δήμου Λευκάδος – Civic engagement platform for the municipality of Lefkada, Greece.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Λευκάδα',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D5EAF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A4A8A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/PegasusFlag.png" />
        <link rel="icon" type="image/png" href="/PegasusFlag.png" />
        <meta name="format-detection" content="telephone=no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('lefkada_theme');
                if (t === '"dark"' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
              // Force-evict any stale service worker that caches HTML
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(reg) {
                    if (reg.active && reg.active.scriptURL.indexOf('sw.js') !== -1) {
                      reg.update();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-[#F2F5F9] dark:bg-[#0B0F18] text-gray-900 dark:text-gray-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
