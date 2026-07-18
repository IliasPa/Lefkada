'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Instagram, Facebook, Twitter, Search, X, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { newsData, reporters, type NewsCategory, type Reporter } from '@/data/news';
import NewsBackground from '@/components/NewsBackground';
import NewsAlerts from '@/components/NewsAlerts';
import PublishedResults from '@/components/PublishedResults';
import { fetchLiveNews, mergeById, useLive } from '@/lib/backend';

const CATEGORIES: Array<{ key: NewsCategory; tKey: string }> = [
  { key: 'Infrastructure', tKey: 'news_cat_Infrastructure' },
  { key: 'Tourism',        tKey: 'news_cat_Tourism' },
  { key: 'Events',         tKey: 'news_cat_Events' },
  { key: 'Council',        tKey: 'news_cat_Council' },
  { key: 'Environment',    tKey: 'news_cat_Environment' },
  { key: 'Culture',        tKey: 'news_cat_Culture' },
];

export default function HomeTab() {
  const { t, lang } = useApp();
  const [query, setQuery] = useState('');
  const [activeReporter, setActiveReporter] = useState<string>('all');
  const [cats, setCats] = useState<NewsCategory[]>([]); // empty = all
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleCat = (c: NewsCategory) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  // Reset the feed to the top when the reporter/theme filters change, so the
  // shorter list doesn't make the page "jump" under the sticky filter bar.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    window.scrollTo(0, 0); // flow mode: the document is the scroller
  }, [activeReporter, cats]);

  // Reporter-submitted news (from /reporters) first, then the bundled items.
  const live = useLive(fetchLiveNews);
  // mergeById: an item can be both fetched live AND already baked into news.json
  // by the weekly sync — the live copy wins, the baked twin is dropped.
  const allNews = useMemo(() => (live ? mergeById(live.items, newsData) : newsData), [live]);
  const allReporters = useMemo(
    () => (live ? [...reporters, ...live.reporters.filter((r) => !reporters.some((x) => x.id === r.id))] : reporters),
    [live],
  );

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return allNews.filter((n) => {
      if (cats.length && !cats.includes(n.category)) return false;
      if (activeReporter !== 'all' && n.reporterId !== activeReporter) return false;
      if (words.length) {
        const hay = [n.title.el, n.title.en, n.description.el, n.description.en, t('news_cat_' + n.category)]
          .join(' ')
          .toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [query, activeReporter, cats, t, allNews]);

  return (
    <div ref={scrollRef} className="h-full scroll-area relative">
      {/* Fixed full-screen Lefkada photo slideshow behind the feed */}
      <NewsBackground />

      <div className="relative z-10">
      {/* Sticky filter bars — translucent so the photo shows through up here too */}
      <div className="sticky top-[var(--sticky-top,0px)] z-10 bg-[#F2F5F9]/25 dark:bg-[#0B0F18]/30 backdrop-blur-md pt-4 pb-2 space-y-2">
        <div className="px-4 max-w-2xl mx-auto space-y-2">
          {/* Search + reporter dropdown on the same line */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder={t('news_search')}
                aria-label={t('news_search')}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[14px] bg-white/90 dark:bg-[#141929]/90 border border-gray-200 dark:border-[#252A3A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label={t('close')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="flex-shrink-0 min-w-[11rem]">
              <ReporterDropdown value={activeReporter} onChange={setActiveReporter} t={t} reporters={allReporters} />
            </div>
          </div>

          {/* Theme (category) filters — centered, wrap to a second line, multi-select */}
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(({ key, tKey }) => {
              const active = cats.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleCat(key)}
                  aria-pressed={active}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95 ${active ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'}`}
                >
                  {t(tKey)}
                </button>
              );
            })}
            {cats.length > 0 && (
              <button onClick={() => setCats([])} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-95 inline-flex items-center gap-1">
                <X size={12} /> {t('news_cat_all')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-6 max-w-2xl mx-auto space-y-4">
        {/* Active city alerts (water/power/fire/weather/road) — below the filters */}
        <NewsAlerts />

        {/* Voting results the mayor published from /admin (hidden when none) */}
        <PublishedResults />

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-10 text-sm">
            {lang === 'el' ? 'Δεν βρέθηκαν νέα.' : 'No news found.'}
          </p>
        )}

        {filtered.map((item) => {
          const reporter = allReporters.find((r) => r.id === item.reporterId);
          return (
          <article
            key={item.id}
            className="
              bg-white dark:bg-[#141929]
              rounded-2xl overflow-hidden
              shadow-sm
              border border-gray-100 dark:border-[#1E2D4E]
              select-none
            "
          >
            {/* Color accent bar */}
            <div className="h-1.5 w-full" style={{ backgroundColor: item.accentColor }} />

            <div className="p-4">
              {/* Category badge */}
              <span
                className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2"
                style={{
                  backgroundColor: item.accentColor + '18',
                  color: item.accentColor,
                }}
              >
                {t('news_cat_' + item.category)}
              </span>

              {/* Title */}
              <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug mb-2">
                {item.title[lang]}
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                {item.description[lang]}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#1E2D4E] px-2.5 py-1 rounded-full">
                  {item.timestamp[lang]}
                </span>

                {/* Social links — the ONLY interactive elements on the card */}
                <div className="flex items-center gap-1.5">
                  {/* Reporter website — app-icon outline button on light-blue */}
                  {reporter && (
                    <a
                      href={reporter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('home_reporter')} – ${reporter.name}`}
                      title={reporter.name}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E3F0FB] dark:bg-[#16314F] transition-transform active:scale-90"
                    >
                      <PegasusMark className="w-4 h-4 bg-[#1B5E9B] dark:bg-blue-300" />
                    </a>
                  )}
                  {item.socialLinks?.instagram && (
                    <SocialBtn href={item.socialLinks.instagram} label={t('home_instagram')} color="#E1306C">
                      <Instagram size={14} />
                    </SocialBtn>
                  )}
                  {item.socialLinks?.facebook && (
                    <SocialBtn href={item.socialLinks.facebook} label={t('home_facebook')} color="#1877F2">
                      <Facebook size={14} />
                    </SocialBtn>
                  )}
                  {item.socialLinks?.twitter && (
                    <SocialBtn href={item.socialLinks.twitter} label={t('home_twitter')} color="#000000">
                      <Twitter size={14} />
                    </SocialBtn>
                  )}
                </div>
              </div>
            </div>
          </article>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/** The app's Pegasus rendered as a single-colour mark via CSS mask, so it can be
 *  tinted (a darker shade of the button's blue) like the other social glyphs. */
function PegasusMark({ className }: { className?: string }) {
  const mask = "url('/pegasus-mark.png') center / contain no-repeat";
  return (
    <span
      aria-hidden
      className={`inline-block flex-shrink-0 ${className ?? ''}`}
      style={{ WebkitMask: mask, mask }}
    />
  );
}

function ReporterDropdown({
  value,
  onChange,
  t,
  reporters,
}: {
  value: string;
  onChange: (id: string) => void;
  t: (k: string) => string;
  reporters: Reporter[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = reporters.find((r) => r.id === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-1.5 pl-3.5 pr-2 py-2.5 rounded-xl text-[14px] border border-gray-200 dark:border-[#252A3A] bg-white/90 dark:bg-[#141929]/90 text-gray-700 dark:text-gray-300"
      >
        <span className={`flex-1 text-left whitespace-nowrap ${selected ? '' : 'text-gray-400 dark:text-gray-500'}`}>
          {selected ? selected.name : t('news_reporter_label')}
        </span>
        {value !== 'all' ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange('all'); }}
            aria-label={t('news_reporters_all')}
            title={t('news_reporters_all')}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90 transition-all"
          >
            <X size={15} />
          </span>
        ) : (
          <ChevronDown size={15} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-[#141929] border border-gray-200 dark:border-[#252A3A] shadow-xl py-1">
          {reporters.map((r) => (
            <button
              key={r.id}
              role="option"
              aria-selected={value === r.id}
              onClick={() => { onChange(r.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-left transition-colors ${value === r.id ? 'bg-primary/10 text-primary dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2D4E]'}`}
            >
              <PegasusMark className="w-3.5 h-3.5 bg-[#1B5E9B] dark:bg-blue-200 flex-shrink-0" />
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialBtn({
  href,
  label,
  color,
  children,
}: {
  href: string;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
      style={{ backgroundColor: color + '18', color }}
    >
      {children}
    </a>
  );
}
