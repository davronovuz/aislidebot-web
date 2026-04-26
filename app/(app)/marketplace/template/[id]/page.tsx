'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { ChevronLeft, Layers, Star, Lock } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  category: string;
  price: number;
  slide_count: number;
  preview_url: string | null;
  colors: string;
  is_premium: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  business:  'Biznes',
  education: 'Ta\'lim',
  creative:  'Ijodiy',
  general:   'Umumiy',
};

export default function TemplateDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const tg      = useRef(getTelegramWebApp());
  const tid     = useRef(getTelegramId());

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading]   = useState(true);
  const [balance, setBalance]   = useState(0);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#F2F2F7');
    tg.current?.setBackgroundColor('#F2F2F7');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        fetch(`/api/templates/${id}`).then(r => r.json()),
        tid.current
          ? fetch(`/api/user-info?telegram_id=${tid.current}`).then(r => r.json())
          : Promise.resolve({}),
      ]);
      if (tRes.ok) setTemplate(tRes.template);
      if (uRes.ok) setBalance(uRes.balance ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center gap-4">
        <p className="text-black/50">Shablon topilmadi</p>
        <button onClick={() => router.back()} className="text-orange-500 text-sm font-medium">
          Orqaga
        </button>
      </div>
    );
  }

  const canAfford = balance >= template.price || template.price === 0;
  const shortage  = template.price - balance;

  const handleUse = () => {
    if (!canAfford) {
      haptic('error');
      router.push('/profile');
      return;
    }
    haptic('medium');
    // Navigate to presentation builder with this template pre-selected
    router.push(`/create/presentation?template_id=${template.id}&template_name=${encodeURIComponent(template.name)}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-[#F2F2F7] px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          onClick={() => { haptic('select'); router.back(); }}
          className="w-9 h-9 rounded-xl bg-black/[0.06] flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-black/60" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-black leading-tight">{template.name}</h1>
          <p className="text-[11px] text-black/35">{CATEGORY_LABELS[template.category] ?? template.category}</p>
        </div>
      </div>

      <div className="px-4 pb-32 space-y-3">
        {/* Preview */}
        <div
          className="w-full h-52 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
          style={{ background: template.colors || 'linear-gradient(135deg,#ff6b35,#f7931e)' }}
        >
          {template.preview_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={template.preview_url} alt={template.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/60">
              <Layers size={40} />
              <span className="text-sm font-medium">Preview yo'q</span>
            </div>
          )}
          {template.is_premium && (
            <div className="absolute top-3 right-3 bg-orange-500 rounded-xl px-2 py-1 flex items-center gap-1">
              <Star size={11} className="text-white" fill="white" />
              <span className="text-white text-[11px] font-bold">PRO</span>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-black/50">Slaydlar soni</span>
            <span className="text-[13px] font-semibold text-black">{template.slide_count} ta</span>
          </div>
          <div className="h-px bg-black/[0.04] my-3" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-black/50">Kategoriya</span>
            <span className="text-[13px] font-semibold text-black">
              {CATEGORY_LABELS[template.category] ?? template.category}
            </span>
          </div>
          <div className="h-px bg-black/[0.04] my-3" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-black/50">Narxi</span>
            <span className="text-[15px] font-bold text-orange-500">
              {template.price > 0 ? `${template.price.toLocaleString()} so'm` : 'Bepul'}
            </span>
          </div>
        </div>

        {/* Balance check */}
        {template.price > 0 && (
          <div className={`rounded-2xl p-4 ${canAfford ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-black/50">Balansingiz</span>
              <span className={`text-[13px] font-semibold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                {balance.toLocaleString()} so'm
              </span>
            </div>
            {!canAfford && (
              <p className="text-[11px] text-red-400 mt-1.5">
                Yetishmaydi: {shortage.toLocaleString()} so'm
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] font-semibold text-black mb-2">Bu shablon haqida</p>
          <p className="text-[12px] text-black/50 leading-relaxed">
            Professional dizaynda {template.slide_count} ta slayd.
            Mavzuingizni kiritsangiz, AI sizning mavzuingizga mos kontent yaratib,
            ushbu shablon dizayni asosida prezentatsiya tayyorlaydi.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-[68px] left-0 right-0 px-4 pb-3">
        <button
          onClick={handleUse}
          className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
            canAfford
              ? 'bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.4)]'
              : 'bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)]'
          }`}
        >
          {canAfford ? (
            template.price > 0
              ? `${template.price.toLocaleString()} so'm — Ishlatish`
              : 'Bepul ishlatish'
          ) : (
            <>
              <Lock size={16} />
              Balansni to'ldirish →
            </>
          )}
        </button>
      </div>
    </div>
  );
}
