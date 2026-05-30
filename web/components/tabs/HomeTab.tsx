'use client';

import { useState } from 'react';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { newsData, type NewsCategory } from '@/data/news';

const CATEGORIES: Array<{ key: NewsCategory | 'all'; tKey: string }> = [
  { key: 'all',            tKey: 'news_cat_all' },
  { key: 'Infrastructure', tKey: 'news_cat_Infrastructure' },
  { key: 'Tourism',        tKey: 'news_cat_Tourism' },
  { key: 'Events',         tKey: 'news_cat_Events' },
  { key: 'Council',        tKey: 'news_cat_Council' },
  { key: 'Environment',    tKey: 'news_cat_Environment' },
  { key: 'Culture',        tKey: 'news_cat_Culture' },
];

export default function HomeTab() {
  const { t, lang } = useApp();
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'all'>('all');

  const filtered =
    activeCategory === 'all'
      ? newsData
      : newsData.filter((n) => n.category === activeCategory);

  return (
    <div className="h-full scroll-area">
      {/* Sticky filter bar — centered */}
      <div className="sticky top-0 z-10 bg-[#F2F5F9]/90 dark:bg-[#0B0F18]/90 backdrop-blur-sm pt-4 pb-2">
        <div className="flex justify-center overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2 px-4">
          {CATEGORIES.map(({ key, tKey }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`
                flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold
                border transition-all duration-150 active:scale-95
                ${activeCategory === key
                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                  : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'
                }
              `}
            >
              {t(tKey)}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 max-w-2xl mx-auto space-y-4">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-10 text-sm">
            {lang === 'el' ? 'Δεν βρέθηκαν νέα.' : 'No news found.'}
          </p>
        )}

        {filtered.map((item) => (
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
                {item.socialLinks && (
                  <div className="flex items-center gap-1.5">
                    {item.socialLinks.instagram && (
                      <SocialBtn href={item.socialLinks.instagram} label={t('home_instagram')} color="#E1306C">
                        <Instagram size={14} />
                      </SocialBtn>
                    )}
                    {item.socialLinks.facebook && (
                      <SocialBtn href={item.socialLinks.facebook} label={t('home_facebook')} color="#1877F2">
                        <Facebook size={14} />
                      </SocialBtn>
                    )}
                    {item.socialLinks.twitter && (
                      <SocialBtn href={item.socialLinks.twitter} label={t('home_twitter')} color="#000000">
                        <Twitter size={14} />
                      </SocialBtn>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
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
