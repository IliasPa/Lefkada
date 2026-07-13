'use client';

/**
 * /pharmacies — private page where each pharmacy account maintains its
 * on-duty (εφημερία) dates. Requires the 'pharmacy' role; the account's
 * pharmacy_id in app_roles links it to its entry in data/pharmacies.ts.
 * The mayor can also log in here and manage any pharmacy.
 */

import { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, Cross, Trash2 } from 'lucide-react';
import AdminShell, { Card, Field, GhostBtn, PrimaryBtn, inputCls, type RoleInfo } from '@/components/admin/AdminShell';
import { getSupabase } from '@/lib/supabase';
import { pharmaciesData } from '@/data/pharmacies';

interface DutyRow {
  id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  duty_date: string;
  hours_el: string;
  hours_en: string;
}

export default function PharmaciesPage() {
  return (
    <AdminShell title="Εφημερίες Φαρμακείων" accent="#16A34A" allowedRoles={['pharmacy', 'mayor']}>
      {(_session, role) => <PharmacyApp role={role} />}
    </AdminShell>
  );
}

function PharmacyApp({ role }: { role: RoleInfo }) {
  const isMayor = role.role === 'mayor';
  const myPharmacy = pharmaciesData.find((p) => p.id === role.pharmacy_id);
  const [pharmacyId, setPharmacyId] = useState(role.pharmacy_id ?? pharmaciesData[0].id);
  const [rows, setRows] = useState<DutyRow[]>([]);
  const [date, setDate] = useState('');
  const [hoursEl, setHoursEl] = useState('Εφημερία όλο το 24ωρο');
  const [hoursEn, setHoursEn] = useState('On duty 24h');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb
      .from('pharmacy_duty')
      .select('id, pharmacy_id, pharmacy_name, duty_date, hours_el, hours_en')
      .order('duty_date');
    setRows((data as DutyRow[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const sb = getSupabase();
    if (!sb || !date) return;
    const ph = pharmaciesData.find((p) => p.id === pharmacyId);
    setBusy(true);
    const { error } = await sb.from('pharmacy_duty').upsert(
      {
        pharmacy_id: pharmacyId,
        pharmacy_name: ph?.name ?? role.display_name ?? '',
        duty_date: date,
        hours_el: hoursEl,
        hours_en: hoursEn,
      },
      { onConflict: 'pharmacy_id,duty_date' },
    );
    setBusy(false);
    if (error) { alert('Σφάλμα: ' + error.message); return; }
    setDate('');
    load();
  };

  const remove = async (r: DutyRow) => {
    if (!confirm(`Διαγραφή εφημερίας ${new Date(r.duty_date).toLocaleDateString('el-GR')};`)) return;
    const { error } = await getSupabase()!.from('pharmacy_duty').delete().eq('id', r.id);
    if (error) alert('Δεν επιτρέπεται (μόνο δικές σας καταχωρήσεις).');
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const mine = rows.filter((r) => isMayor || r.pharmacy_id === (role.pharmacy_id ?? pharmacyId));

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <h2 className="font-black text-lg flex items-center gap-2">
        <Cross size={18} className="text-green-600" />
        {isMayor ? 'Εφημερίες όλων των φαρμακείων' : (myPharmacy?.name ?? role.display_name ?? 'Φαρμακείο')}
      </h2>

      <Card className="p-4 space-y-4">
        <h3 className="font-bold text-[14px] flex items-center gap-1.5">
          <CalendarPlus size={15} className="text-green-600" /> Δήλωση εφημερίας
        </h3>
        {isMayor && (
          <Field label="Φαρμακείο">
            <select value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)} className={inputCls}>
              {pharmaciesData.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.area.el}</option>)}
            </select>
          </Field>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Ημερομηνία">
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ωράριο (ελληνικά)">
            <input value={hoursEl} onChange={(e) => setHoursEl(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ωράριο (αγγλικά)">
            <input value={hoursEn} onChange={(e) => setHoursEn(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="flex justify-end">
          <PrimaryBtn onClick={add} disabled={busy || !date}>{busy ? 'Αποθήκευση…' : 'Καταχώρηση'}</PrimaryBtn>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="font-bold text-[13px] uppercase tracking-wider text-gray-400">Προγραμματισμένες εφημερίες</h3>
        {mine.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Δεν υπάρχουν καταχωρημένες εφημερίες.</p>
        ) : (
          mine.map((r) => {
            const isToday = r.duty_date === today;
            const past = r.duty_date < today;
            return (
              <Card key={r.id} className={`p-3.5 flex items-center gap-3 ${past ? 'opacity-50' : ''}`}>
                <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                  isToday ? 'bg-green-600 text-white' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                  <span className="text-[15px] font-black leading-none">{new Date(r.duty_date).getDate()}</span>
                  <span className="text-[9px] font-bold uppercase">
                    {new Date(r.duty_date).toLocaleDateString('el-GR', { month: 'short' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[13.5px]">
                    {isMayor && `${r.pharmacy_name} — `}
                    {new Date(r.duty_date).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {isToday && <span className="ml-1.5 text-[10px] font-black text-green-600">ΣΗΜΕΡΑ</span>}
                  </p>
                  <p className="text-[12px] text-gray-400">{r.hours_el}</p>
                </div>
                <GhostBtn danger onClick={() => remove(r)} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
              </Card>
            );
          })
        )}
      </div>
      <p className="text-[11px] text-gray-400 text-center pb-4">
        Η εφημερία εμφανίζεται αυτόματα στην εφαρμογή την ημέρα που ισχύει.
      </p>
    </div>
  );
}
