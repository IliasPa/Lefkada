"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, FileText, Trash2, CheckCircle2, User, Plus, Save, Stethoscope, BadgeCheck, LogOut, Heart, Briefcase } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { KEYS, storageGet, storageSet, storageRemove } from "@/lib/storage";
import { backendConfigured, getSupabase } from "@/lib/supabase";
import {
  getVerifiedUser, sendVerifyCode, confirmVerifyCode, signOutVerified, syncCitizenProfile,
  fetchOwnCitizenStatus, type VerifiedUser, type CitizenStatus,
} from "@/lib/backend";
import { showCitizenStatusNotification } from "@/lib/notify";

interface Doctor { id: string; name: string; specialty: string; phone: string; }
interface Profile {
  fullName: string; email: string; gender: string;
  birthDate: string; height: string; selectedSkills: string[]; doctors: Doctor[];
  /** ΑΦΜ — synced (with the name) to the municipality's citizen registry
   *  while verified, so the mayor can match the municipal roll. Free text for
   *  now; gov.gr sign-in will fill it automatically later. */
  taxNumber: string;
  /** ΑΜΚΑ — stored for the future Health-tab features; unused for now. */
  amka: string;
}
const DEFAULT_PROFILE: Profile = {
  fullName: "", email: "", gender: "", birthDate: "", height: "", selectedSkills: [], doctors: [],
  taxNumber: "", amka: "",
};
const MAX_DOCS = 3;

const SKILLS: Array<{ key: string; el: string; en: string }> = [
  { key: "Communication", el: "Επικοινωνία", en: "Communication" },
  { key: "Nursing", el: "Νοσηλευτική", en: "Nursing" },
  { key: "Administration", el: "Διοίκηση", en: "Administration" },
  { key: "Data Entry", el: "Εισαγωγή Δεδομένων", en: "Data Entry" },
  { key: "Customer Support", el: "Εξυπηρέτηση Πελατών", en: "Customer Support" },
  { key: "Logistics", el: "Logistics", en: "Logistics" },
  { key: "Healthcare Assistance", el: "Υγειονομική Βοήθεια", en: "Healthcare Assistance" },
  { key: "Sales", el: "Πωλήσεις", en: "Sales" },
  { key: "Project Coordination", el: "Συντονισμός Έργου", en: "Project Coordination" },
  { key: "Laboratory Handling", el: "Εργαστηριακή Διαχείριση", en: "Laboratory Handling" },
];
const GENDERS: Array<{ key: string; el: string; en: string }> = [
  { key: "male", el: "Άντρας", en: "Male" },
  { key: "female", el: "Γυναίκα", en: "Female" },
  { key: "nb", el: "Μη-δυαδικό", en: "Non-binary" },
  { key: "pnts", el: "Προτιμώ να μην αναφέρω", en: "Prefer not to say" },
];

export default function ProfileForm() {
  const { t, lang } = useApp();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [cvFilename, setCvFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile({ ...DEFAULT_PROFILE, ...storageGet<Partial<Profile>>(KEYS.profile, {}) });
    setCvFilename(storageGet<string>(KEYS.cvFilename, ""));
  }, []);

  const setP = useCallback(<K extends keyof Profile>(key: K, val: Profile[K]) => {
    setProfile((p) => ({ ...p, [key]: val }));
  }, []);

  const toggleSkill = useCallback((skill: string) => {
    setP("selectedSkills", profile.selectedSkills.includes(skill)
      ? profile.selectedSkills.filter((s) => s !== skill)
      : [...profile.selectedSkills, skill]);
  }, [profile.selectedSkills, setP]);

  const saveProfile = useCallback(() => {
    storageSet(KEYS.profile, profile);
    // While verified, name/ΑΦΜ also go to the municipality's citizen registry
    // (municipal-roll matching) — fire-and-forget, no-op when signed out.
    syncCitizenProfile();
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [profile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCvFilename(file.name); storageSet(KEYS.cvFilename, file.name); }
  };
  const removeCV = () => {
    setCvFilename(""); storageRemove(KEYS.cvFilename);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const addDoctor = () => {
    if (profile.doctors.length >= MAX_DOCS) return;
    setP("doctors", [...profile.doctors, { id: Date.now().toString(), name: "", specialty: "", phone: "" }]);
  };
  const delDoc = (id: string) => setP("doctors", profile.doctors.filter((d) => d.id !== id));
  const updDoc = <K extends keyof Doctor>(id: string, key: K, val: Doctor[K]) =>
    setP("doctors", profile.doctors.map((d) => (d.id === id ? { ...d, [key]: val } : d)));

  return (
    <div className="space-y-5">
      {/* Verified identity (email OTP — one account, one verified vote) */}
      {backendConfigured && <VerifySection t={t} lang={lang} />}

      {/* Identity — name & email are shared with the mayor ONLY when the user
          chooses to message non-anonymously; name/ΑΦΜ also sync to the
          municipal registry while verified (said plainly under Verification). */}
      <PSect icon={<User size={14} />} label={t("acc_identity")}>
        <PField label={t("acc_full_name")}>
          <PInput value={profile.fullName} onChange={(v) => setP("fullName", v)} placeholder={lang === "el" ? "π.χ. Ελένη Παπαδοπούλου" : "e.g. Eleni Papadopoulou"} autoComplete="name" />
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <PField label={t("acc_email")}>
          <PInput value={profile.email} onChange={(v) => setP("email", v)} placeholder="name@example.com" type="email" autoComplete="email" />
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <PField label={t("acc_tax_number")}>
          <PInput value={profile.taxNumber} onChange={(v) => setP("taxNumber", v)} placeholder={lang === "el" ? "π.χ. 123456789" : "e.g. 123456789"} inputMode="numeric" maxLength={9} />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">{t("acc_tax_note")}</p>
        </PField>
      </PSect>

      {/* Health — kept in one place for the Health tab; not used anywhere yet
          (the feature activates in a future update). */}
      <PSect icon={<Heart size={14} />} label={t("acc_health")}>
        <PField label={t("acc_gender")}>
          <div className="flex flex-wrap gap-1.5">
            {GENDERS.map((g) => (
              <button key={g.key} onClick={() => setP("gender", g.key)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 ${profile.gender === g.key ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-[#252A3A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#3A4155]"}`}>
                {lang === "el" ? g.el : g.en}
              </button>
            ))}
          </div>
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <PField label={t("acc_birth_date")}>
          <PInput value={profile.birthDate} onChange={(v) => setP("birthDate", v)} placeholder={lang === "el" ? "π.χ. 15/04/1985" : "e.g. 15/04/1985"} inputMode="numeric" />
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <PField label={t("acc_height")}>
          <PInput value={profile.height} onChange={(v) => setP("height", v)} placeholder={lang === "el" ? "π.χ. 175" : "e.g. 175"} inputMode="numeric" />
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <PField label={t("acc_amka")}>
          <PInput value={profile.amka} onChange={(v) => setP("amka", v)} placeholder={lang === "el" ? "π.χ. 01018509876" : "e.g. 01018509876"} inputMode="numeric" maxLength={11} />
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Stethoscope size={13} className="text-primary dark:text-primary-300" />
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 dark:text-gray-500">{t("acc_doctors")}</p>
          </div>
          <div className="space-y-3">
            {profile.doctors.map((doc, idx) => (
              <div key={doc.id} className="border border-gray-200 dark:border-[#3A4155] rounded-xl p-3 bg-gray-50 dark:bg-[#0F1219] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide">{t("acc_doctor_n")} {idx + 1}</span>
                  <button onClick={() => delDoc(doc.id)} className="text-red-400 p-1 active:scale-90"><Trash2 size={13} /></button>
                </div>
                <PInput value={doc.name} onChange={(v) => updDoc(doc.id, "name", v)} placeholder={t("acc_doctor_name")} />
                <PInput value={doc.specialty} onChange={(v) => updDoc(doc.id, "specialty", v)} placeholder={t("acc_specialty")} />
                <PInput value={doc.phone} onChange={(v) => updDoc(doc.id, "phone", v)} placeholder={t("acc_doctor_phone")} type="tel" inputMode="tel" />
              </div>
            ))}
            {profile.doctors.length < MAX_DOCS ? (
              <button onClick={addDoctor} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-[#3A4155] rounded-xl text-[13px] font-semibold text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary dark:hover:text-primary-300 transition-colors active:scale-[0.98]">
                <Plus size={15} />{t("acc_add_doctor")} ({profile.doctors.length}/{MAX_DOCS})
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400 py-1">{t("acc_max_doctors")}</p>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("acc_health_note")}</p>
      </PSect>

      {/* Career + CV */}
      <PSect icon={<Briefcase size={14} />} label={t("acc_career")}>
        <PField label={profile.selectedSkills.length > 0 ? `${t("acc_skills_label")} · ${profile.selectedSkills.length} ${t("acc_selected")}` : t("acc_skills_label")}>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((sk) => {
              const on = profile.selectedSkills.includes(sk.key);
              return (
                <button key={sk.key} onClick={() => toggleSkill(sk.key)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 ${on ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-[#252A3A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#3A4155]"}`}>
                  {on ? "✓ " : ""}{lang === "el" ? sk.el : sk.en}
                </button>
              );
            })}
          </div>
        </PField>
        <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />
        <div>
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 dark:text-gray-500 mb-2">{t("settings_cv_section")}</p>
          {cvFilename ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl">
              <FileText size={16} className="text-green-500 flex-shrink-0" />
              <span className="flex-1 text-[12px] font-semibold text-green-700 dark:text-green-300 truncate">{cvFilename}</span>
              <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-primary dark:text-primary-300 px-1.5">{t("settings_cv_change")}</button>
              <button onClick={removeCV} className="text-red-400"><Trash2 size={13} /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#252A3A] text-gray-400 dark:text-gray-500 text-[13px] font-semibold hover:border-primary hover:text-primary dark:hover:text-primary-300 transition-colors active:scale-[0.98]">
              <Upload size={16} />{t("settings_cv_upload")}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-0.5">{t("settings_cv_hint")}</p>
        </div>
      </PSect>

      <button onClick={saveProfile}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] shadow-lg transition-all active:scale-[0.98] ${saveState === "saved" ? "bg-green-500 shadow-green-500/30" : "bg-primary shadow-primary/30 hover:bg-primary-600"} text-white`}>
        {saveState === "saved" ? (<><CheckCircle2 size={18} />{t("acc_saved")}</>) : (<><Save size={18} />{t("acc_save")}</>)}
      </button>
      <p className="text-center text-[10px] text-gray-400 dark:text-gray-600">{t("acc_local_note")}</p>
    </div>
  );
}

/** Email-OTP verification: sign in so votes count as verified (one account =
 *  one vote per poll), sign out so the next person can vote from the same
 *  device. Shows the municipal-roll designation (set only by the mayor) and a
 *  one-time notice when the municipality changes it. gov.gr becomes a second
 *  method here once the municipality's ΚΕΔ approval lands — the rest of the
 *  pipeline is already method-agnostic. */
function VerifySection({ t, lang }: { t: (k: string) => string; lang: "el" | "en" }) {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [stage, setStage] = useState<"idle" | "code">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<CitizenStatus | null>(null);
  const [changedTo, setChangedTo] = useState<boolean | null>(null);

  // Municipal-roll designation: fetch own registry row, and when it differs
  // from the last-seen value show the notice once (banner + notification).
  const loadStatus = useCallback(async () => {
    const s = await fetchOwnCitizenStatus();
    setStatus(s);
    if (!s) return;
    const now = String(s.resident);
    const seen = storageGet<string>(KEYS.citizenStatus, "");
    if (seen !== "" && seen !== now) {
      setChangedTo(s.resident);
      showCitizenStatusNotification(lang, s.resident);
    }
    storageSet(KEYS.citizenStatus, now);
  }, [lang]);

  useEffect(() => {
    getVerifiedUser().then((u) => {
      setUser(u);
      if (u) loadStatus();
    });
  }, [loadStatus]);

  // The email can arrive as an 8-digit code OR as a sign-in link, depending on
  // the Supabase email template. The link signs the user in by itself when
  // tapped — listen for that session so the card completes either way.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? "" });
        setStage("idle"); setCode(""); setEmail(""); setError("");
        syncCitizenProfile();
        loadStatus();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadStatus]);

  /** Supabase's raw reasons, translated where they matter: sign-ups still
   *  disabled in the dashboard, or the SMTP hand-off failing server-side. */
  const showError = (msg: string) =>
    /signup|sign-?up/i.test(msg) && /not allowed|disabled/i.test(msg)
      ? t("acc_signup_disabled")
      : /error sending .*email/i.test(msg)
        ? t("acc_email_send_fail")
        : `${t("acc_verify_error")} (${msg})`;

  const send = async () => {
    if (!email.trim() || busy) return;
    setBusy(true); setError("");
    const r = await sendVerifyCode(email.trim());
    setBusy(false);
    if (r.ok) setStage("code");
    else setError(r.error ?? "");
  };
  const confirm = async () => {
    if (!code.trim() || busy) return;
    setBusy(true); setError("");
    const r = await confirmVerifyCode(email.trim(), code);
    setBusy(false);
    if (r.ok) {
      setUser(await getVerifiedUser()); setStage("idle"); setCode(""); setEmail("");
      // First sync of name/ΑΦΜ into the registry, then read the designation.
      await syncCitizenProfile();
      loadStatus();
    } else setError(r.error ?? "");
  };
  const signOut = async () => {
    await signOutVerified();
    setUser(null); setStage("idle"); setEmail(""); setCode(""); setError("");
    setStatus(null); setChangedTo(null);
  };

  return (
    <PSect icon={<BadgeCheck size={14} />} label={t("acc_verify_section")}>
      {user ? (
        <div className="space-y-3">
          {changedTo !== null && (
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 text-[12px] font-semibold text-primary dark:text-primary-300">
              {changedTo ? t("acc_citizen_changed_on") : t("acc_citizen_changed_off")}
            </div>
          )}
          <div className="flex items-center gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl">
            <BadgeCheck size={20} className="text-green-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-green-700 dark:text-green-300">{t("acc_verified_badge")}</p>
              <p className="text-[12px] text-green-600 dark:text-green-400 truncate mt-0.5">{user.email}</p>
              {status?.resident && (
                <p className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-[11px] font-bold text-primary dark:text-primary-300">
                  🏛 {t("acc_citizen_badge")}
                </p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("acc_sync_note")}</p>
          <button onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 dark:border-[#3A4155] text-gray-500 dark:text-gray-400 text-sm font-bold hover:border-primary hover:text-primary dark:hover:text-primary-300 transition-colors active:scale-[0.98]">
            <LogOut size={15} />{t("acc_sign_out")}
          </button>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("acc_sign_out_hint")}</p>
        </div>
      ) : stage === "code" ? (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-600 dark:text-gray-300">
            {t("acc_verify_sent_to")} <span className="font-bold">{email.trim()}</span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{t("acc_verify_code_or_link")}</p>
          <PInput value={code} onChange={setCode} placeholder={t("acc_verify_code_ph")}
            inputMode="numeric" autoComplete="one-time-code" maxLength={8} />
          {error && <p className="text-[12px] font-semibold text-red-500">{showError(error)}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setStage("idle"); setCode(""); setError(""); }}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#3A4155] text-[13px] font-bold text-gray-500 dark:text-gray-400 active:scale-[0.98] transition-transform">
              {t("acc_verify_back")}
            </button>
            <button onClick={confirm} disabled={code.trim().length < 8 || busy}
              className={`flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.98] ${code.trim().length >= 8 && !busy ? "bg-primary shadow-md shadow-primary/30" : "bg-gray-200 dark:bg-[#252A3A] text-gray-400 cursor-not-allowed"}`}>
              {t("acc_verify_confirm")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{t("acc_verify_intro")}</p>
          <PInput value={email} onChange={setEmail} placeholder="name@example.com" type="email" autoComplete="email" />
          {error && <p className="text-[12px] font-semibold text-red-500">{showError(error)}</p>}
          <button onClick={send} disabled={!email.trim() || busy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.98] ${email.trim() && !busy ? "bg-primary shadow-md shadow-primary/30" : "bg-gray-200 dark:bg-[#252A3A] text-gray-400 cursor-not-allowed"}`}>
            <BadgeCheck size={16} />{busy ? "…" : t("acc_verify_send")}
          </button>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("acc_verify_govgr_note")}</p>
        </div>
      )}
    </PSect>
  );
}

function PSect({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span className="text-primary dark:text-primary-300">{icon}</span>}
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-400 dark:text-gray-500">{label}</p>
      </div>
      <div className="bg-gray-50 dark:bg-[#0F1219] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-3 space-y-3">{children}</div>
    </div>
  );
}
function PField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-[0.05em]">{label}</label>
      {children}
    </div>
  );
}
function PInput(props: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const { value, onChange, ...rest } = props;
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-[#3A4155] bg-white dark:bg-[#0F1219] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
      {...rest} />
  );
}
