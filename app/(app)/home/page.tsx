'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface UserInfo {
  balance: number;
  free_presentations: number;
  subscription: { display_name: string } | null;
}

const CATEGORIES = [
  { key: 'presentation', label: 'Prezentatsiya', emoji: '📊' },
  { key: 'document',     label: 'Ilmiy ishlar',  emoji: '📚' },
  { key: 'creative',     label: 'Ijodiy',         emoji: '🎨' },
] as const;

export default function HomePage() {
  const tg    = useRef(getTelegramWebApp());
  const tid   = useRef(getTelegramId());
  const router = useRouter();

  const user = tg.current?.initDataUnsafe?.user;
  const [info, setInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#F2F2F7');
    tg.current?.setBackgroundColor('#F2F2F7');
  }, []);

  useEffect(() => {
    if (!tid.current) return;
    fetch(`/api/user-info?telegram_id=${tid.current}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setInfo(d); })
      .catch(() => {});
  }, []);

  const go = (id: string) => {
    haptic('medium');
    if (id === 'presentation') router.push('/create/presentation');
    else router.push(`/create/${id.replace(/_/g, '-')}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">

      {/* Top greeting + balance */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[12px] text-black/35 font-medium">Assalomu alaykum 👋</p>
            <h1 className="text-[24px] font-bold text-black leading-tight mt-0.5">
              {user?.first_name ?? 'Foydalanuvchi'}
            </h1>
          </div>
          <div className="text-right">
            {info && (
              <>
                <p className="text-[11px] text-black/30">Balans</p>
                <p className="text-[18px] font-bold text-black leading-tight">
                  {info.balance.toLocaleString()}
                  <span className="text-[11px] font-medium text-black/35 ml-0.5">so'm</span>
                </p>
                {info.free_presentations > 0 && (
                  <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                    🎁 {info.free_presentations} ta bepul
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl px-4 py-3.5 shadow-lg shadow-orange-200">
          <p className="text-white text-[15px] font-semibold">Nima yaratmoqchisiz?</p>
          <p className="text-orange-100 text-[12px] mt-0.5">Quyidan tanlang, qolganini AI qiladi</p>
        </div>
      </div>

      {/* Product list */}
      <div className="px-4 space-y-4 pb-6">
        {CATEGORIES.map(cat => {
          const products = PRODUCTS.filter(p => p.category === cat.key);
          if (!products.length) return null;
          return (
            <div key={cat.key}>
              <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">
                {cat.emoji} {cat.label}
              </p>
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => go(p.id)}
                    className={cn(
                      'w-full px-4 py-3.5 flex items-center gap-3.5 text-left',
                      'active:bg-black/[0.02] transition-colors'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[20px]">{p.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-black">{p.name}</p>
                      <p className="text-[12px] text-black/35 mt-0.5 truncate">{p.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-black/20 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
