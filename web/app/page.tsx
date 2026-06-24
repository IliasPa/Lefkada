'use client';

import { useEffect, useRef } from 'react';
import { AppProvider, useApp, type TabKey } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import SettingsPanel from '@/components/SettingsPanel';
import HomeTab from '@/components/tabs/HomeTab';
import CultureTab from '@/components/tabs/CultureTab';
import VoteTab from '@/components/tabs/VoteTab';
import HealthTab from '@/components/tabs/HealthTab';
import FinancialsTab from '@/components/tabs/FinancialsTab';
import JobsTab from '@/components/tabs/JobsTab';
import GameTab from '@/components/tabs/GameTab';
import ContactsTab from '@/components/tabs/ContactsTab';

function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

function TabContent({ tab }: { tab: TabKey }) {
  switch (tab) {
    case 'home':       return <HomeTab />;
    case 'culture':    return <CultureTab />;
    case 'vote':       return <VoteTab />;
    case 'health':     return <HealthTab />;
    case 'financials': return <FinancialsTab />;
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
      <AppShell />
    </AppProvider>
  );
}
