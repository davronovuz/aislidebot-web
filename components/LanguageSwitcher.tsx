'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const OPTIONS: { code: 'uz' | 'ru' | 'en'; flag: string }[] = [
  { code: 'uz', flag: '🇺🇿' },
  { code: 'ru', flag: '🇷🇺' },
  { code: 'en', flag: '🇬🇧' },
];

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('lang');
  const current = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const pick = (code: string) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setOpen(false);
    startTransition(() => router.refresh());
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium tap-effect"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{OPTIONS.find((o) => o.code === current)?.flag ?? '🌐'}</span>
        <span>{t(current as 'uz' | 'ru' | 'en')}</span>
        <span className="text-black/40">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg"
        >
          {OPTIONS.map((opt) => (
            <li key={opt.code}>
              <button
                type="button"
                onClick={() => pick(opt.code)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm tap-effect hover:bg-black/5 ${
                  opt.code === current ? 'font-semibold' : ''
                }`}
                role="option"
                aria-selected={opt.code === current}
              >
                <span>{opt.flag}</span>
                <span>{t(opt.code)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
