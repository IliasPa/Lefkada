"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, CornerDownLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { KEYS, storageGet, storageSet } from "@/lib/storage";
import {
  baseIndex,
  loadDecisions,
  runSearch,
  CAT_ORDER,
  type SearchCat,
  type SearchEntry,
} from "@/lib/search";

const MAX_PER_CAT = 6;

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setActiveTab, setGovIntent, setCultureIntent } = useApp();
  const [query, setQuery] = useState("");
  const [decisions, setDecisions] = useState<SearchEntry[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load the lazy decisions corpus the first time the overlay opens; focus input.
  useEffect(() => {
    if (!open) return;
    setRecent(storageGet<string[]>(KEYS.recentSearch, []));
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    loadDecisions().then(setDecisions);
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset the query each time it reopens.
  useEffect(() => { if (open) setQuery(""); }, [open]);

  const navEntries = useMemo(() => baseIndex().filter((e) => e.cat === "nav"), []);

  const groups = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as [SearchCat, SearchEntry[]][];
    const hits = runSearch([...baseIndex(), ...decisions], q, 120);
    const map = new Map<SearchCat, SearchEntry[]>();
    for (const h of hits) {
      const arr = map.get(h.cat) ?? [];
      if (arr.length < MAX_PER_CAT) arr.push(h);
      map.set(h.cat, arr);
    }
    return CAT_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as [SearchCat, SearchEntry[]]);
  }, [query, decisions]);

  const totalHits = useMemo(() => groups.reduce((n, [, arr]) => n + arr.length, 0), [groups]);

  if (!open) return null;

  const rememberQuery = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 6);
    setRecent(next);
    storageSet(KEYS.recentSearch, next);
  };

  const go = (entry: SearchEntry) => {
    rememberQuery(query);
    if (entry.route.govIntent) setGovIntent(entry.route.govIntent);
    if (entry.route.cultureIntent) setCultureIntent(entry.route.cultureIntent);
    setActiveTab(entry.route.tab);
    onClose();
  };

  const clearRecent = () => { setRecent([]); storageSet(KEYS.recentSearch, []); };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t("search_open")}
      style={{ paddingTop: "var(--sat)" }}
    >
      {/* Backdrop */}
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />

      {/* Sheet */}
      <div className="relative z-10 flex flex-col h-full bg-[#F2F5F9] dark:bg-[#0B0F18]">
        {/* Search bar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 h-14 border-b border-gray-200 dark:border-[#1E2D4E] bg-white/80 dark:bg-[#0F1219]/80 backdrop-blur-xl">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
            className="flex-1 min-w-0 bg-transparent text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label={t("search_clear")} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-1 px-2.5 py-1.5 rounded-lg text-[13px] font-bold text-primary dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95 transition"
          >
            {t("search_close")}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scroll-area px-3 py-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {!query.trim() ? (
              <>
                {recent.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">{t("search_recent")}</p>
                      <button onClick={clearRecent} className="text-[12px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">{t("search_recent_clear")}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <button key={r} onClick={() => { setQuery(r); inputRef.current?.focus(); }} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#151B28] border border-gray-200 dark:border-[#1E2D4E] text-gray-700 dark:text-gray-200 hover:border-primary/40 active:scale-95 transition">
                          {r}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section>
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2">{t("search_jump")}</p>
                  <div className="flex flex-wrap gap-2">
                    {navEntries.map((e) => (
                      <button key={e.id} onClick={() => go(e)} className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-white dark:bg-[#151B28] border border-gray-200 dark:border-[#1E2D4E] text-gray-700 dark:text-gray-200 hover:border-primary/40 hover:text-primary dark:hover:text-primary-300 active:scale-95 transition">
                        {e.title[lang]}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : totalHits === 0 ? (
              <div className="text-center py-16">
                <Search size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("search_no_results")} <span className="font-bold text-gray-700 dark:text-gray-200">“{query.trim()}”</span>
                </p>
              </div>
            ) : (
              groups.map(([cat, entries]) => (
                <section key={cat}>
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2">
                    {t(`search_cat_${cat}`)} <span className="text-gray-300 dark:text-gray-600">· {entries.length}</span>
                  </p>
                  <div className="space-y-1.5">
                    {entries.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => go(e)}
                        className="group w-full flex items-center gap-3 text-left px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#151B28] border border-gray-100 dark:border-[#1E2D4E] hover:border-primary/40 active:scale-[0.99] transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{e.title[lang]}</p>
                          {e.sub && e.sub[lang] && (
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{e.sub[lang]}</p>
                          )}
                        </div>
                        <CornerDownLeft size={15} className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-primary dark:group-hover:text-primary-300 transition" />
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
