'use client';

/**
 * Ειδοποιήσεις — one tab for everything the municipality pushes to citizens:
 * risk warnings (water/power/fire/weather/road, shown in the app's Home tab)
 * and plain notifications (push-only, no in-app warning). Publishing a warning
 * sends the push automatically — no confirmation dialog.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Send } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import KindManager, { ALERT_KIND } from './ContentView';
import { Card, Field, PrimaryBtn, inputCls } from './AdminShell';

async function sendPush(title: string, body: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) return 'Το backend δεν είναι ρυθμισμένο.';
  const { data, error } = await sb.functions.invoke('send-push', { body: { title, body, url: '/' } });
  if (error) return 'Σφάλμα αποστολής push: ' + error.message + ' (έχει γίνει deploy της συνάρτησης send-push; — δείτε SETUP_BACKEND.md §6)';
  const d = data as { sent?: number; total?: number };
  return `Push: εστάλη σε ${d?.sent ?? 0} από ${d?.total ?? 0} συνδρομητές.`;
}

export default function AlertsView() {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getSupabase()
      ?.from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .then(({ count: c }) => setCount(c ?? 0));
  }, []);

  // Auto-push whenever a warning is published (create or unhide) — no dialog.
  const onPublished = async (_kind: string, data: Record<string, unknown>) => {
    const d = data as { area?: { el?: string }; message?: { el?: string } };
    setStatus('Αποστολή push…');
    setStatus(await sendPush('⚠️ Ειδοποίηση — Δήμος Λευκάδος', `${d.area?.el ?? ''}: ${d.message?.el ?? ''}`));
  };

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-3">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Bell size={18} className="text-primary dark:text-primary-300" /> Ειδοποιήσεις & Προειδοποιήσεις
        </h2>
        <p className="text-sm text-gray-400">
          Εγγεγραμμένες συσκευές: <strong>{count ?? '…'}</strong>. Κάθε προειδοποίηση που δημοσιεύεται
          στέλνεται αυτόματα ως push· η «απλή ειδοποίηση» στέλνει μόνο push, χωρίς προειδοποίηση στην εφαρμογή.
        </p>
        {!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
          <Card className="p-3 flex items-start gap-2 border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/15">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Λείπει το <code className="font-mono font-bold">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> από τα
              Vercel Environment Variables — καμία συσκευή δεν μπορεί να εγγραφεί σε push μέχρι να προστεθεί
              (και να γίνει redeploy). Δείτε SETUP_BACKEND.md §6.
            </p>
          </Card>
        )}
        {status && (
          <Card className="p-3 text-[12.5px] font-semibold text-gray-600 dark:text-gray-300">{status}</Card>
        )}
        <SimpleNotification onResult={setStatus} />
      </div>

      <KindManager
        kinds={[ALERT_KIND]}
        intro="Προειδοποιήσεις κινδύνου — εμφανίζονται στην αρχική σελίδα και στέλνονται αυτόματα ως push."
        onPublished={onPublished}
      />
    </div>
  );
}

/** Push-only message: reaches subscribed devices without adding a warning. */
function SimpleNotification({ onResult }: { onResult: (s: string) => void }) {
  const [title, setTitle] = useState('Δήμος Λευκάδος');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    onResult(await sendPush(title.trim() || 'Δήμος Λευκάδος', body.trim()));
    setBusy(false);
    setBody('');
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-bold text-[14px] flex items-center gap-1.5">
        <Send size={14} className="text-primary dark:text-primary-300" /> Απλή ειδοποίηση (μόνο push)
      </h3>
      <div className="grid sm:grid-cols-[1fr_2fr] gap-2">
        <Field label="Τίτλος">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Μήνυμα">
          <input value={body} onChange={(e) => setBody(e.target.value)} className={inputCls}
            placeholder="π.χ. Αύριο ανοίγει η πλατφόρμα αιτήσεων για τους παιδικούς σταθμούς" />
        </Field>
      </div>
      <div className="flex justify-end">
        <PrimaryBtn onClick={send} disabled={busy || !body.trim()}>
          {busy ? 'Αποστολή…' : 'Αποστολή σε όλους'}
        </PrimaryBtn>
      </div>
    </Card>
  );
}
