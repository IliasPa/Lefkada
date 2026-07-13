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
  // Keyboard must overlay the page instead of resizing the layout viewport —
  // iOS standalone PWAs sometimes fail to restore the resized viewport after
  // the keyboard closes, leaving a dead band at the bottom of the screen.
  interactiveWidget: 'resizes-visual',
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
              // Mode classes, decided before first paint (see globals.css):
              //  .pwa  — installed to the Home Screen: fixed shell, pixel-sized.
              //  .flow — public app in a browser tab: the document scrolls, so
              //          Safari can collapse its bar into the floating pill.
              // The /admin portals keep the fixed shell everywhere (no .flow).
              var root = document.documentElement;
              var isPwa = false;
              try {
                isPwa = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches ||
                        window.navigator.standalone === true;
              } catch (e) {}
              if (isPwa) {
                root.classList.add('pwa');
                // Size the shell from the VISUAL viewport in pixels: iOS
                // standalone can leave the layout viewport (and dvh/lvh with
                // it) stuck at a reduced height after the keyboard closes —
                // the grey dead band at the bottom. The visual viewport
                // reports the truth, and explicit pixels always paint to the
                // real bottom of the screen.
                var setH = function () {
                  var vv = window.visualViewport;
                  var h = vv ? Math.round(vv.height + vv.offsetTop) : window.innerHeight;
                  if (h > 0) root.style.setProperty('--app-height', h + 'px');
                };
                setH();
                if (window.visualViewport) window.visualViewport.addEventListener('resize', setH);
                window.addEventListener('resize', setH);
                window.addEventListener('orientationchange', function () { setTimeout(setH, 250); });
              } else if (location.pathname === '/' || location.pathname === '/index.html') {
                root.classList.add('flow');
              }
              if (!root.classList.contains('flow')) {
                // Fixed-shell modes only — in flow mode the window is MEANT to
                // scroll, so none of these may run there.
                // iOS: when the keyboard closes, the window can stay scrolled
                // so the fixed header is left off-screen — snap it back.
                document.addEventListener('focusout', function () {
                  setTimeout(function () { window.scrollTo(0, 0); }, 60);
                });
                // Catch-all: any leftover window offset shifts the fixed shell
                // up. Snap back unless the user is typing (iOS scrolls the
                // window to keep the focused input above the keyboard).
                window.addEventListener('scroll', function () {
                  var ae = document.activeElement;
                  var typing = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
                  if (!typing && (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop)) {
                    window.scrollTo(0, 0);
                  }
                }, { passive: true });
                // …and when the visual viewport grows back to full height
                // (keyboard dismissed), reset any stale offset.
                if (window.visualViewport) {
                  window.visualViewport.addEventListener('resize', function () {
                    if (window.visualViewport.height >= window.innerHeight - 60) {
                      window.scrollTo(0, 0);
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    }
                  });
                }
              }
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
