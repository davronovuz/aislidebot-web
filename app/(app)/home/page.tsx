'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

interface UserInfo {
  balance: number;
  free_presentations: number;
  username: string | null;
  first_name: string | null;
  subscription: { display_name: string } | null;
}

// 2 column grid grouping
const SECTIONS = [
  {
    label: 'Prezentatsiya',
    ids: ['presentation'],
  },
  {
    label: 'Ilmiy ishlar',
    ids: [
      'mustaqil_ish',
      'referat',
      'kurs_ishi',
      'diplom_ishi',
      'magistr_diss',
      'tezis',
      'ilmiy_maqola',
    ],
  },
  {
    label: 'Amaliy va hisobot',
    ids: ['laboratoriya_ishi', 'amaliy_ish', 'hisobot'],
  },
  {
    label: 'Ijodiy',
    ids: ['krossvord'],
  },
];

export default function HomePage() {
  const tg     = useRef(getTelegramWebApp());
  const tid    = useRef(getTelegramId());
  const router = useRouter();
  const [user, setUser] = useState(tg.current?.initDataUnsafe?.user);
  const [info, setInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#F2F2F7');
    tg.current?.setBackgroundColor('#F2F2F7');

    const loadFor = (id: number) => {
      fetch(`/api/user-info?telegram_id=${id}`)
        .then(r => r.json()).then(d => { if (d.ok) setInfo(d); }).catch(() => {});
    };

    if (tid.current) { loadFor(tid.current); return; }

    let tries = 0;
    const iv = setInterval(() => {
      const id = getTelegramId();
      const u = tg.current?.initDataUnsafe?.user;
      if (u) setUser(u);
      if (id) { tid.current = id; clearInterval(iv); loadFor(id); }
      else if (++tries >= 20) clearInterval(iv);
    }, 150);
    return () => clearInterval(iv);
  }, []);

  const go = (id: string) => {
    haptic('medium');
    if (id === 'presentation') router.push('/create/presentation');
    else router.push(`/create/${id.replace(/_/g, '-')}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-black/35 font-medium">Assalomu alaykum 👋</p>
            <h1 className="text-[22px] font-bold text-black mt-0.5">
              {user?.first_name ?? info?.first_name ?? info?.username ?? 'Foydalanuvchi'}
            </h1>
          </div>

          {/* Balance pill */}
          {info && (
            <div className="bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.07)] text-right">
              <p className="text-[9px] text-black/30 font-semibold uppercase tracking-wide">Balans</p>
              <p className="text-[17px] font-bold text-black leading-tight">
                {info.balance.toLocaleString()}
                <span className="text-[10px] text-black/30 ml-0.5">so'm</span>
              </p>
            </div>
          )}
        </div>

        {/* Tagline */}
        <div className="mt-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl px-4 py-3 shadow-md shadow-orange-200">
          <p className="text-white text-[14px] font-semibold">Nima yaratamiz bugun? ✨</p>
          <p className="text-orange-100 text-[11px] mt-0.5">Quyidan tanlang — AI qolganini qiladi</p>
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 pb-8 space-y-5">
        {SECTIONS.map(section => {
          const products = PRODUCTS.filter(p => section.ids.includes(p.id));
          if (!products.length) return null;

          // Bir mahsulotli sectionlar (Prezentatsiya, Krossvord) — full-width hero
          if (products.length === 1) {
            return (
              <section key={section.label}>
                <SectionHeading label={section.label} count={1} />
                <HeroCard product={products[0]} onClick={() => go(products[0].id)} />
              </section>
            );
          }

          return (
            <section key={section.label}>
              <SectionHeading label={section.label} count={products.length} />
              <div className="grid grid-cols-2 gap-2.5">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => go(p.id)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <p className="text-[12px] font-bold text-black/55 uppercase tracking-wider">{label}</p>
      <span className="text-[10px] font-semibold text-black/30 bg-black/5 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

function HeroCard({
  product,
  onClick,
}: {
  product: typeof PRODUCTS[0];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full bg-white rounded-2xl p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        'active:scale-[0.98] transition-transform duration-100 flex items-center gap-3.5'
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0 shadow-inner">
        <span className="text-[28px] leading-none">{product.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-black leading-tight">{product.name}</p>
        <p className="text-[12px] text-black/40 mt-1 leading-snug">{product.desc}</p>
      </div>
      <ChevronRight />
    </button>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: typeof PRODUCTS[0];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl p-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        'active:scale-[0.97] transition-transform duration-100',
        'flex flex-col h-[132px]'
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center shrink-0">
        <span className="text-[20px] leading-none">{product.icon}</span>
      </div>
      <p className="text-[13px] font-bold text-black leading-tight mt-2.5 line-clamp-1">{product.name}</p>
      <p className="text-[11px] text-black/40 mt-1 leading-snug line-clamp-2">{product.desc}</p>
    </button>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-black/25 shrink-0">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
