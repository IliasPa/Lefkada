"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Send,
  CheckCircle2,
  User,
  EyeOff,
  Plus,
  ShieldAlert,
  ShieldOff,
  Save,
  Stethoscope,
  Megaphone,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { KEYS, storageGet, storageSet, storageRemove } from "@/lib/storage";
import VetoOverlay from "@/components/VetoOverlay";
import AnimatedSegmented from "@/components/AnimatedSegmented";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}
interface Profile {
  fullName: string;
  idNumber: string;
  email: string;
  gender: string;
  birthDate: string;
  height: string;
  selectedSkills: string[];
  doctors: Doctor[];
}
const DEFAULT_PROFILE: Profile = {
  fullName: "",
  idNumber: "",
  email: "",
  gender: "",
  birthDate: "",
  height: "",
  selectedSkills: [],
  doctors: [],
};
const MAX_DOCS = 3;

const SKILLS: Array<{ key: string; el: string; en: string }> = [
  { key: "Communication", el: "Επικοινωνία", en: "Communication" },
  { key: "Nursing", el: "Νοσηλευτική", en: "Nursing" },
  { key: "Administration", el: "Διοίκηση", en: "Administration" },
  { key: "Data Entry", el: "Εισαγωγή Δεδομένων", en: "Data Entry" },
  {
    key: "Customer Support",
    el: "Εξυπηρέτηση Πελατών",
    en: "Customer Support",
  },
  { key: "Logistics", el: "Logistics", en: "Logistics" },
  {
    key: "Healthcare Assistance",
    el: "Υγειονομική Βοήθεια",
    en: "Healthcare Assistance",
  },
  { key: "Sales", el: "Πωλήσεις", en: "Sales" },
  {
    key: "Project Coordination",
    el: "Συντονισμός Έργου",
    en: "Project Coordination",
  },
  {
    key: "Laboratory Handling",
    el: "Εργαστηριακή Διαχείριση",
    en: "Laboratory Handling",
  },
];
const GENDERS: Array<{ key: string; el: string; en: string }> = [
  { key: "male", el: "Άντρας", en: "Male" },
  { key: "female", el: "Γυναίκα", en: "Female" },
  { key: "nb", el: "Μη-δυαδικό", en: "Non-binary" },
  { key: "pnts", el: "Προτιμώ να μην αναφέρω", en: "Prefer not to say" },
];

export default function SettingsPanel() {
  const { t, lang } = useApp();

  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [cvFilename, setCvFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [vetoActive, setVetoActive] = useState(false);
  const [vetoOverlay, setVetoOverlay] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setProfile({
      ...DEFAULT_PROFILE,
      ...storageGet<Partial<Profile>>(KEYS.profile, {}),
    });
    setCvFilename(storageGet<string>(KEYS.cvFilename, ""));
    setAnonymous(storageGet<boolean>(KEYS.mayorAnonymous, true));
    setVetoActive(storageGet<boolean>(KEYS.veto, false));
  }, []);

  // 5-second auto-dismiss for mayor "sent" state
  useEffect(() => {
    if (!sent) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setSent(false);
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sent]);

  const setP = useCallback(
    <K extends keyof Profile>(key: K, val: Profile[K]) => {
      setProfile((p) => ({ ...p, [key]: val }));
    },
    [],
  );

  const toggleSkill = useCallback(
    (skill: string) => {
      setP(
        "selectedSkills",
        profile.selectedSkills.includes(skill)
          ? profile.selectedSkills.filter((s) => s !== skill)
          : [...profile.selectedSkills, skill],
      );
    },
    [profile.selectedSkills, setP],
  );

  const saveProfile = useCallback(() => {
    storageSet(KEYS.profile, profile);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [profile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFilename(file.name);
      storageSet(KEYS.cvFilename, file.name);
    }
  };

  const removeCV = () => {
    setCvFilename("");
    storageRemove(KEYS.cvFilename);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addDoctor = () => {
    if (profile.doctors.length >= MAX_DOCS) return;
    const newDoc: Doctor = {
      id: Date.now().toString(),
      name: "",
      specialty: "",
      phone: "",
    };
    setP("doctors", [...profile.doctors, newDoc]);
  };

  const delDoc = (id: string) =>
    setP(
      "doctors",
      profile.doctors.filter((d) => d.id !== id),
    );
  const updDoc = <K extends keyof Doctor>(
    id: string,
    key: K,
    val: Doctor[K],
  ) => {
    setP(
      "doctors",
      profile.doctors.map((d) => (d.id === id ? { ...d, [key]: val } : d)),
    );
  };

  const handleVetoPress = () => {
    if (vetoActive) {
      setVetoActive(false);
      storageSet(KEYS.veto, false);
    } else setVetoOverlay(true);
  };
  const handleVetoDismiss = useCallback(() => {
    setVetoOverlay(false);
    setVetoActive(true);
    storageSet(KEYS.veto, true);
  }, []);

  const handleAnon = (a: boolean) => {
    setAnonymous(a);
    storageSet(KEYS.mayorAnonymous, a);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const data = {
      text: message,
      anonymous,
      ...(anonymous ? {} : { name: profile.fullName, email: profile.email }),
      timestamp: new Date().toISOString(),
    };
    storageSet(KEYS.mayorMessage, data);
    setSent(true);
    setMessage("");
  };

  return (
    <>
      <div className="h-full scroll-area">
        <div className="pb-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="px-4 pt-4 mb-4">
            <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">
              {t("tab_account")}
            </h1>
          </div>

          {/* Content sections */}
          <div className="px-4 space-y-6">
            {/* ══ PROFILE ══════════════════════════════════════════════════════ */}

            {/* Identity */}
            <PSect icon={<User size={14} />} label={t("acc_identity")}>
              <PField label={t("acc_full_name")}>
                <PInput
                  value={profile.fullName}
                  onChange={(v) => setP("fullName", v)}
                  placeholder={
                    lang === "el"
                      ? "π.χ. Ελένη Παπαδοπούλου"
                      : "e.g. Eleni Papadopoulou"
                  }
                  autoComplete="name"
                />
              </PField>
              <div className="h-px bg-gray-50 dark:bg-[#1E2D4E]" />
              <PField label={t("acc_id_number")}>
                <PInput
                  value={profile.idNumber}
                  onChange={(v) => setP("idNumber", v)}
                  placeholder={
                    lang === "el" ? "π.χ. ΑΒ 123456" : "e.g. AB 123456"
                  }
                />
              </PField>
              <div className="h-px bg-gray-50 dark:bg-[#1E2D4E]" />
              <PField label={t("acc_email")}>
                <PInput
                  value={profile.email}
                  onChange={(v) => setP("email", v)}
                  placeholder="name@example.com"
                  type="email"
                  autoComplete="email"
                />
              </PField>
              <div className="h-px bg-gray-50 dark:bg-[#1E2D4E]" />
              <PField label={t("acc_gender")}>
                <div className="flex flex-wrap gap-1.5">
                  {GENDERS.map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setP("gender", g.key)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 ${profile.gender === g.key ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-[#252A3A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#3A4155]"}`}
                    >
                      {lang === "el" ? g.el : g.en}
                    </button>
                  ))}
                </div>
              </PField>
              <div className="h-px bg-gray-50 dark:bg-[#1E2D4E]" />
              <PField label={t("acc_birth_date")}>
                <PInput
                  value={profile.birthDate}
                  onChange={(v) => setP("birthDate", v)}
                  placeholder={
                    lang === "el" ? "π.χ. 15/04/1985" : "e.g. 15/04/1985"
                  }
                  inputMode="numeric"
                />
              </PField>
              <div className="h-px bg-gray-50 dark:bg-[#1E2D4E]" />
              <PField label={t("acc_height")}>
                <PInput
                  value={profile.height}
                  onChange={(v) => setP("height", v)}
                  placeholder={lang === "el" ? "π.χ. 175" : "e.g. 175"}
                  inputMode="numeric"
                />
              </PField>
            </PSect>

            {/* Career + CV */}
            <PSect icon={<FileText size={14} />} label={t("acc_career")}>
              <PField
                label={
                  profile.selectedSkills.length > 0
                    ? `${t("acc_skills_label")} · ${profile.selectedSkills.length} ${t("acc_selected")}`
                    : t("acc_skills_label")
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((sk) => {
                    const on = profile.selectedSkills.includes(sk.key);
                    return (
                      <button
                        key={sk.key}
                        onClick={() => toggleSkill(sk.key)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 ${on ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-[#252A3A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#3A4155]"}`}
                      >
                        {on ? "✓ " : ""}
                        {lang === "el" ? sk.el : sk.en}
                      </button>
                    );
                  })}
                </div>
              </PField>
              <div className="h-px bg-gray-50 dark:bg-[#1E2D4E]" />
              {/* CV upload */}
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 dark:text-gray-500 mb-2">
                  {t("settings_cv_section")}
                </p>
                {cvFilename ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl">
                    <FileText
                      size={16}
                      className="text-green-500 flex-shrink-0"
                    />
                    <span className="flex-1 text-[12px] font-semibold text-green-700 dark:text-green-300 truncate">
                      {cvFilename}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-primary dark:text-primary-300 px-1.5"
                    >
                      {t("settings_cv_change")}
                    </button>
                    <button onClick={removeCV} className="text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#252A3A] text-gray-400 dark:text-gray-500 text-[13px] font-semibold hover:border-primary hover:text-primary dark:hover:text-primary-300 transition-colors active:scale-[0.98]"
                  >
                    <Upload size={16} />
                    {t("settings_cv_upload")}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFile}
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-0.5">
                  {t("settings_cv_hint")}
                </p>
              </div>
            </PSect>

            {/* Doctors */}
            <PSect icon={<Stethoscope size={14} />} label={t("acc_doctors")}>
              <div className="px-4 py-3 space-y-3">
                {profile.doctors.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 dark:border-[#3A4155] rounded-xl p-3 bg-gray-50 dark:bg-[#0F1219] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide">
                        {t("acc_doctor_n")} {idx + 1}
                      </span>
                      <button
                        onClick={() => delDoc(doc.id)}
                        className="text-red-400 p-1 active:scale-90"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <PInput
                      value={doc.name}
                      onChange={(v) => updDoc(doc.id, "name", v)}
                      placeholder={t("acc_doctor_name")}
                    />
                    <PInput
                      value={doc.specialty}
                      onChange={(v) => updDoc(doc.id, "specialty", v)}
                      placeholder={t("acc_specialty")}
                    />
                    <PInput
                      value={doc.phone}
                      onChange={(v) => updDoc(doc.id, "phone", v)}
                      placeholder={t("acc_doctor_phone")}
                      type="tel"
                      inputMode="tel"
                    />
                  </div>
                ))}
                {profile.doctors.length < MAX_DOCS ? (
                  <button
                    onClick={addDoctor}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-[#3A4155] rounded-xl text-[13px] font-semibold text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary dark:hover:text-primary-300 transition-colors active:scale-[0.98]"
                  >
                    <Plus size={15} />
                    {t("acc_add_doctor")} ({profile.doctors.length}/{MAX_DOCS})
                  </button>
                ) : (
                  <p className="text-center text-xs text-gray-400 py-1">
                    {t("acc_max_doctors")}
                  </p>
                )}
              </div>
            </PSect>

            {/* Save button */}
            <button
              onClick={saveProfile}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] shadow-lg transition-all active:scale-[0.98] ${saveState === "saved" ? "bg-green-500 shadow-green-500/30" : "bg-primary shadow-primary/30 hover:bg-primary-600"} text-white`}
            >
              {saveState === "saved" ? (
                <>
                  <CheckCircle2 size={18} />
                  {t("acc_saved")}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t("acc_save")}
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 -mt-3">
              {t("acc_local_note")}
            </p>

            <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />

            {/* ══ OFFICIAL ACTIONS (VETO) ════════════════════════════════════ */}
            <PSect icon={<ShieldAlert size={14} />} label={t("acc_official")}>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  {t("acc_veto_desc")}
                </p>
                {vetoActive ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl veto-pulse">
                      <ShieldAlert
                        size={20}
                        className="text-red-500 flex-shrink-0"
                      />
                      <div>
                        <p className="font-bold text-sm text-red-600 dark:text-red-400">
                          {t("acc_veto_active_label")}
                        </p>
                        <p className="text-xs text-red-400 mt-0.5">
                          {lang === "el"
                            ? "Η διαμαρτυρία σας είναι ενεργή"
                            : "Your protest is active"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleVetoPress}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-[0.98]"
                    >
                      <ShieldOff size={16} />
                      {t("acc_veto_revoke")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleVetoPress}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-lg tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-[0.97]"
                  >
                    <ShieldAlert size={22} />
                    {t("acc_veto_exercise")}
                  </button>
                )}
              </div>
            </PSect>

            <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />

            {/* ══ MAYOR MESSAGE ═════════════════════════════════════════════ */}
            <PSect
              icon={<Send size={14} />}
              label={t("settings_mayor_section")}
            >
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center px-4">
                  <CheckCircle2 size={40} className="text-green-500" />
                  <div>
                    <p className="font-bold text-[15px] text-gray-900 dark:text-white">
                      {t("settings_mayor_sent_title")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t("settings_mayor_sent_text")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-500">
                        {countdown}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {lang === "el"
                        ? "Αυτόματη επαναφορά σε"
                        : "Auto-reset in"}{" "}
                      {countdown}s
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Anonymity — compact, left-aligned animated segmented toggle */}
                    <AnimatedSegmented
                      size="sm"
                      options={[
                        {
                          key: "anon",
                          label: t("settings_mayor_anonymous"),
                          icon: <EyeOff size={12} />,
                        },
                        {
                          key: "profile",
                          label: t("settings_mayor_with_profile"),
                          icon: <User size={12} />,
                        },
                      ]}
                      value={anonymous ? "anon" : "profile"}
                      onChange={(k) => handleAnon(k === "anon")}
                    />
                    {/* 4MyCity — report a city issue to the municipality */}
                    <a
                      href="https://4mycity.lefkada.gov.gr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("settings_4mycity_aria")}
                      title={t("settings_4mycity_aria")}
                      className="flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/30"
                    >
                      <Megaphone size={14} className="flex-shrink-0" />
                      <span className="hidden min-[400px]:inline">4MyCity</span>
                    </a>
                  </div>
                  {!anonymous && (profile.fullName || profile.email) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                      <User
                        size={12}
                        className="text-primary dark:text-primary-300 flex-shrink-0"
                      />
                      <p className="text-[12px] text-primary dark:text-primary-300 font-medium">
                        {[profile.fullName, profile.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("settings_mayor_placeholder")}
                    rows={4}
                    className="w-full px-3.5 py-3 rounded-xl text-[14px] leading-relaxed resize-none bg-gray-50 dark:bg-[#252A3A] border border-gray-200 dark:border-[#3A4155] text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] transition-all active:scale-[0.98] ${message.trim() ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-100 dark:bg-[#252A3A] text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}
                  >
                    <Send size={16} />
                    {t("settings_mayor_send")}
                  </button>
                </div>
              )}
            </PSect>
          </div>
        </div>
      </div>

      <VetoOverlay visible={vetoOverlay} onDismiss={handleVetoDismiss} />
    </>
  );
}

function PSect({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon && (
          <span className="text-primary dark:text-primary-300">{icon}</span>
        )}
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">
          {label}
        </p>
      </div>
      <div className="bg-gray-50 dark:bg-[#0F1219] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] overflow-hidden">
        <div className="px-4 py-3 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function PField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-[0.05em]">
        {label}
      </label>
      {children}
    </div>
  );
}

function PInput(
  props: { value: string; onChange: (v: string) => void } & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange"
  >,
) {
  const { value, onChange, ...rest } = props;
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-[#3A4155] bg-white dark:bg-[#0F1219] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
      {...rest}
    />
  );
}

