'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

interface UserInfo {
  balance: number;
  free_presentations: number;
  subscription: { display_name: string } | null;
}

// 2 column grid grouping
const SECTIONS = [
  {
    label: 'Prezentatsiya',
    ids: ['presentation', 'pitch_deck'],
  },
  {
    label: 'Ilmiy ishlar',
    ids: ['mustaqil_ish', 'referat', 'kurs_ishi', 'diplom', 'magistr', 'tezis', 'ilmiy_maqola'],
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
  const user   = tg.current?.initDataUnsafe?.user;
  const [info, setInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#F2F2F7');
    tg.current?.setBackgroundColor('#F2F2F7');
    if (tid.current) {
      fetch(`/api/user-info?telegram_id=${tid.current}`)
        .then(r => r.json()).then(d => { if (d.ok) setInfo(d); }).catch(() => {});
    }
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
              {user?.first_name ?? 'Foydalanuvchi'}
            </h1>
          </div>

          {/* Balance pill */}
          {info && (
            <div className="bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.07)] text-right">
              {info.free_presentations > 0 ? (
                <>
                  <p className="text-[9px] text-orange-400 font-semibold uppercase tracking-wide">Bepul</p>
                  <p className="text-[17px] font-bold text-orange-500 leading-tight">{info.free_presentations} ta</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] text-black/30 font-semibold uppercase tracking-wide">Balans</p>
                  <p className="text-[17px] font-bold text-black leading-tight">
                    {info.balance.toLocaleString()}
                    <span className="text-[10px] text-black/30 ml-0.5">so'm</span>
                  </p>
                </>
              )}
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
      <div className="px-4 pb-6 space-y-4">
        {SECTIONS.map(section => {
          const products = PRODUCTS.filter(p => section.ids.includes(p.id));
          if (!products.length) return null;
          return (
            <div key={section.label}>
              <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-0.5">
                {section.label}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => go(p.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
        'bg-white rounded-2xl p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        'active:scale-[0.97] transition-transform duration-100 flex flex-col gap-2.5'
      )}
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <span className="text-[22px]">{product.icon}</span>
      </div>
      <div>
        <p className="text-[13px] font-bold text-black leading-snug">{product.name}</p>
        <p className="text-[11px] text-black/35 mt-0.5 leading-snug line-clamp-2">{product.desc}</p>
      </div>
    </button>
  );
}
