'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { ChevronLeft, Layers, Star, Lock, X } from 'lucide-react';
import { BOT_API_URL } from '@/lib/constants';

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

interface SlideText {
  n: number;
  title: string;
  body: string;
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
  const [slides, setSlides]     = useState<SlideText[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [balance, setBalance]   = useState(0);
  const [activeSlide, setActiveSlide] = useState<number | null>(null);

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
      if (tRes.ok) {
        setTemplate(tRes.template);
        setSlides(tRes.slides_text ?? []);
        setPreviewCount(tRes.preview_count ?? 0);
      }
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
    router.push(`/create/presentation?template_id=${template.id}&template_name=${encodeURIComponent(template.name)}`);
  };

  const slideImg = (n: number) => `${BOT_API_URL}/api/templates/${template.id}/preview/${n}`;
  const slideTitle = (n: number) => slides.find(s => s.n === n)?.title || `Slayd ${n}`;
  const slideBody = (n: number) => slides.find(s => s.n === n)?.body || '';

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
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-black leading-tight truncate">{template.name}</h1>
          <p className="text-[11px] text-black/35">{CATEGORY_LABELS[template.category] ?? template.category}</p>
        </div>
        {template.is_premium && (
          <div className="bg-orange-500 rounded-lg px-2 py-1 flex items-center gap-0.5">
            <Star size={10} className="text-white" fill="white" />
            <span className="text-white text-[10px] font-bold">PRO</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-32 space-y-4">
        {/* Hero preview (slide 1) */}
        <div
          className="w-full rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-black/5 aspect-video"
          style={{ background: previewCount === 0 ? template.colors : '#000' }}
        >
          {previewCount > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slideImg(1)}
              alt={`${template.name} preview`}
              className="w-full h-full object-contain bg-white"
              onClick={() => { haptic('select'); setActiveSlide(1); }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/60">
              <Layers size={40} />
              <span className="text-sm">Preview yo&apos;q</span>
            </div>
          )}
        </div>

        {/* Slide thumbnails grid */}
        {previewCount > 1 && (
          <div>
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">
              Slaydlar ({previewCount})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: previewCount }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    onClick={() => { haptic('select'); setActiveSlide(n); }}
                    className="relative aspect-video bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slideImg(n)} alt={`Slayd ${n}`} className="w-full h-full object-contain bg-white" loading="lazy" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Info */}
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

        {/* Balance */}
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
              ? `${template.price.toLocaleString()} so'm — Sotib olish`
              : 'Bepul ishlatish'
          ) : (
            <>
              <Lock size={16} />
              Balansni to'ldirish →
            </>
          )}
        </button>
      </div>

      {/* Lightbox */}
      {activeSlide !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={() => setActiveSlide(null)}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-[13px] font-semibold">Slayd {activeSlide} / {previewCount}</span>
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slideImg(activeSlide)} alt={`Slayd ${activeSlide}`} className="max-w-full max-h-full object-contain" />
          </div>
          {(slideTitle(activeSlide) || slideBody(activeSlide)) && (
            <div
              className="bg-white/5 backdrop-blur-md p-4 max-h-[35vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {slideTitle(activeSlide) && (
                <p className="text-[14px] font-bold text-white">{slideTitle(activeSlide)}</p>
              )}
              {slideBody(activeSlide) && (
                <p className="text-[12px] text-white/70 mt-2 whitespace-pre-line leading-relaxed">{slideBody(activeSlide)}</p>
              )}
            </div>
          )}
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={e => { e.stopPropagation(); setActiveSlide(Math.max(1, activeSlide - 1)); }}
              disabled={activeSlide <= 1}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-[12px] font-semibold disabled:opacity-30"
            >
              ‹ Orqaga
            </button>
            <button
              onClick={e => { e.stopPropagation(); setActiveSlide(Math.min(previewCount, activeSlide + 1)); }}
              disabled={activeSlide >= previewCount}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-[12px] font-semibold disabled:opacity-30"
            >
              Keyingi ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
