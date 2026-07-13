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
  // Zoom enabled for accessibility (WCAG 1.4.4 resize text).
  userScalable: true,
  viewportFit: 'cover',
};

// First news background photo — the LCP element on the landing tab.
const FIRST_BG =
  'https://commons.wikimedia.org/wiki/Special:FilePath/Porto_Katsiki_6108.JPG?width=1600';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/PegasusFlag.png" />
        <link rel="icon" type="image/png" href="/PegasusFlag.png" />
        {/* Leaflet styles for the Explore/Culture map (the JS is lazy-loaded) */}
        <link rel="stylesheet" href="/leaflet.css" />
        {/* Preload only the first slideshow image (LCP); the rest load lazily */}
        <link rel="preload" as="image" href={FIRST_BG} />
        <link rel="preconnect" href="https://upload.wikimedia.org" crossOrigin="anonymous" />
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
              // iOS: when the keyboard closes, the window can stay scrolled so
              // the fixed header/tab bar is left off-screen — snap it back.
              document.addEventListener('focusout', function () {
                setTimeout(function () { window.scrollTo(0, 0); }, 60);
              });
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
