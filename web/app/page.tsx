'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUp, Search } from 'lucide-react';
import { AppProvider, useApp, type TabKey } from '@/context/AppContext';
import { showAlertNotification } from '@/lib/notify';
import { subscribeToPush } from '@/lib/backend';
import AppHeader from '@/components/AppHeader';
import HomeTab from '@/components/tabs/HomeTab';

// Code-split the non-landing tabs so the initial bundle stays small; each loads
// the first time its tab is opened.
const TabLoading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-4 border-primary-300 border-t-primary animate-spin" />
  </div>
);
const lazy = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { ssr: false, loading: TabLoading });

const CultureTab = lazy(() => import('@/components/tabs/CultureTab'));
const GovernanceTab = lazy(() => import('@/components/tabs/GovernanceTab'));
const AboutTab = lazy(() => import('@/components/tabs/AboutTab'));
const ServicesTab = lazy(() => import('@/components/tabs/ServicesTab'));
const EducationTab = lazy(() => import('@/components/tabs/EducationTab'));
const HealthTab = lazy(() => import('@/components/tabs/HealthTab'));
const FinancialsTab = lazy(() => import('@/components/tabs/FinancialsTab'));
const JobsTab = lazy(() => import('@/components/tabs/JobsTab'));
const ContactsTab = lazy(() => import('@/components/tabs/ContactsTab'));
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));

// The search index pulls in every data module, so defer it to its own chunk that
// only loads when the user first opens search.
const SearchOverlay = dynamic(() => import('@/components/SearchOverlay'), { ssr: false });

function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

// Re-sends the risk-alert notification on every app open (in case it was missed)
// when notifications are enabled — and re-upserts the push subscription, so the
// server-side row self-heals for already-subscribed devices. (Devices with NO
// subscription can only get one from the Settings toggle: iOS allows
// pushManager.subscribe() only inside a user gesture.)
function AlertNotifier() {
  const { notifications, lang } = useApp();
  useEffect(() => {
    if (!notifications) return;
    showAlertNotification(lang);
    subscribeToPush().then((r) => {
      if (typeof r === 'object') console.warn('Push re-subscribe failed:', r.error);
    });
  }, [notifications, lang]);
  return null;
}

function TabContent({ tab }: { tab: TabKey }) {
  switch (tab) {
    case 'home':       return <HomeTab />;
    case 'culture':    return <CultureTab />;
    case 'health':     return <HealthTab />;
    case 'financials': return <FinancialsTab />;
    case 'governance': return <GovernanceTab />;
    case 'about':      return <AboutTab />;
    case 'services':   return <ServicesTab />;
    case 'education':  return <EducationTab />;
    case 'jobs':       return <JobsTab />;
    case 'contacts':   return <ContactsTab />;
    case 'account':    return <SettingsPanel />;
  }
}

function AppShell() {
  const { activeTab } = useApp();
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.classList.remove('tab-content');
    void el.offsetHeight;
    el.classList.add('tab-content');
    el.scrollTop = 0;
    window.scrollTo(0, 0); // flow mode: the document is the scroller
  }, [activeTab]);

  return (
    <div
      className="app-shell flex flex-col bg-[#F2F5F9] dark:bg-[#0B0F18]"
      style={{ paddingTop: 'calc(var(--sat) + 4px)' }}
    >
      {/* Combined header: logo + tabs + controls */}
      <AppHeader />

      {/* Scrollable content — no bottom padding here: content runs edge-to-edge
          under the iPhone home indicator (the .scroll-area rule pads the END of
          the scrolled content instead, so nothing hides behind the indicator).
          Padding the container left a dead ~34px band in the installed PWA. */}
      <main
        ref={contentRef}
        className="flex-1 overflow-hidden relative tab-content"
      >
        <TabContent tab={activeTab} />
      </main>

      {/* Outside <main>: its tab-switch animation must never become the
          containing block for this button's fixed positioning (flow mode). */}
      <FloatingButton onSearch={() => setSearchOpen(true)} />

      {searchOpen && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

/** A single floating circle, bottom-right. It is **universal search** while the
 *  active scroll area is near the top, and morphs into **back-to-top** once the
 *  user scrolls down past the threshold — so the slot is never idle. */
function FloatingButton({ onSearch }: { onSearch: () => void }) {
  const { t, activeTab } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = (e: Event) => {
      if (e.target === document) {
        // flow mode — the document itself scrolls
        targetRef.current = null;
        setScrolled(window.scrollY > 400);
        return;
      }
      const el = e.target as HTMLElement;
      if (!el?.classList?.contains('scroll-area')) return;
      targetRef.current = el;
      setScrolled(el.scrollTop > 400);
    };
    // capture phase — scroll events don't bubble
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  // Reset to the search state whenever the tab changes (new scroll area starts at top).
  useEffect(() => { setScrolled(false); }, [activeTab]);

  const backToTop = () =>
    (targetRef.current ?? window).scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrolled ? backToTop : onSearch}
      aria-label={scrolled ? t('scroll_top') : t('search_open')}
      title={scrolled ? t('scroll_top') : t('search_open')}
      className="float-btn z-30 w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/30 active:scale-90 transition-transform"
    >
      {scrolled ? <ArrowUp size={20} /> : <Search size={20} />}
    </button>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <ServiceWorkerRegistration />
      <AlertNotifier />
      <AppShell />
    </AppProvider>
  );
}
