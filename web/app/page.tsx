'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUp, Search } from 'lucide-react';
import { AppProvider, useApp, type TabKey } from '@/context/AppContext';
import { showAlertNotification } from '@/lib/notify';
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
// when notifications are enabled.
function AlertNotifier() {
  const { notifications, lang } = useApp();
  useEffect(() => {
    if (notifications) showAlertNotification(lang);
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
  }, [activeTab]);

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#F2F5F9] dark:bg-[#0B0F18]"
      style={{ paddingTop: 'var(--sat)' }}
    >
      {/* Combined header: logo + tabs + controls */}
      <AppHeader />

      {/* Scrollable content */}
      <main
        ref={contentRef}
        className="flex-1 overflow-hidden relative tab-content"
        style={{ paddingBottom: 'var(--sab)' }}
      >
        <TabContent tab={activeTab} />
        <FloatingButton onSearch={() => setSearchOpen(true)} />
      </main>

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

  const backToTop = () => targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrolled ? backToTop : onSearch}
      aria-label={scrolled ? t('scroll_top') : t('search_open')}
      title={scrolled ? t('scroll_top') : t('search_open')}
      className="absolute z-30 bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/30 active:scale-90 transition-transform"
      style={{ marginBottom: 'var(--sab)' }}
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
