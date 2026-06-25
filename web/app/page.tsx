'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
const VoteTab = lazy(() => import('@/components/tabs/VoteTab'));
const HealthTab = lazy(() => import('@/components/tabs/HealthTab'));
const FinancialsTab = lazy(() => import('@/components/tabs/FinancialsTab'));
const JobsTab = lazy(() => import('@/components/tabs/JobsTab'));
const GameTab = lazy(() => import('@/components/tabs/GameTab'));
const ContactsTab = lazy(() => import('@/components/tabs/ContactsTab'));
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));

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
    case 'vote':       return <VoteTab />;
    case 'health':     return <HealthTab />;
    case 'financials': return <FinancialsTab />;
    case 'governance': return <GovernanceTab />;
    case 'jobs':       return <JobsTab />;
    case 'game':       return <GameTab />;
    case 'contacts':   return <ContactsTab />;
    case 'account':    return <SettingsPanel />;
  }
}

function AppShell() {
  const { activeTab } = useApp();
  const contentRef = useRef<HTMLDivElement>(null);

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
      </main>
    </div>
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
