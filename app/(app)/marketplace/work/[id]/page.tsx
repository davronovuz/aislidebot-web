'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { ChevronLeft, BookMarked, FileText, Lock, X } from 'lucide-react';
import { BOT_API_URL } from '@/lib/constants';

interface ReadyWork {
  id: number;
  title: string;
  subject: string;
  work_type: string;
  page_count: number;
  price: number;
  preview_available: boolean;
  description: string;
  language: string;
  file_id: string;
  preview_file_id: string | null;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  mustaqil_ish: 'Mustaqil ish',
  referat:      'Referat',
  kurs_ishi:    'Kurs ishi',
  diplom:       'Diplom ishi',
  magistr:      'Magistr',
  tezis:        'Tezis',
  ilmiy_maqola: 'Ilmiy maqola',
};

const LANG_LABELS: Record<string, string> = {
  uz: "O'zbekcha",
  ru: 'Ruscha',
  en: 'Inglizcha',
};

export default function WorkDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const tg      = useRef(getTelegramWebApp());
  const tid     = useRef(getTelegramId());

  const [work, setWork]                 = useState<ReadyWork | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [balance, setBalance]           = useState(0);
  const [buying, setBuying]             = useState(false);
  const [activePage, setActivePage]     = useState<number | null>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#F2F2F7');
    tg.current?.setBackgroundColor('#F2F2F7');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wRes, uRes] = await Promise.all([
        fetch(`/api/ready-works/${id}`).then(r => r.json()),
        tid.current
          ? fetch(`/api/user-info?telegram_id=${tid.current}`).then(r => r.json())
          : Promise.resolve({}),
      ]);
      if (wRes.ok) {
        setWork(wRes.work);
        setPreviewCount(wRes.preview_count ?? 0);
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

  if (!work) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center gap-4">
        <p className="text-black/50">Ish topilmadi</p>
        <button onClick={() => router.back()} className="text-orange-500 text-sm font-medium">
          Orqaga
        </button>
      </div>
    );
  }

  const canAfford = balance >= work.price;
  const shortage  = work.price - balance;

  const handleBuy = async () => {
    if (!canAfford) {
      haptic('error');
      router.push('/profile');
      return;
    }
    if (!tid.current) {
      haptic('error');
      return;
    }
    haptic('medium');
    setBuying(true);
    try {
      const res = await fetch('/api/submit-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ready_work_purchase',
          telegram_id: tid.current,
          work_id: work.id,
          title: work.title,
          price: work.price,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        haptic('success');
        tg.current?.showAlert?.(
          `✅ Muvaffaqiyatli! "${work.title}" fayli Telegram'ga yuborildi.`
        );
        router.push('/history');
      } else if (data.error === 'insufficient_balance') {
        haptic('error');
        router.push('/profile');
      } else {
        haptic('error');
        tg.current?.showAlert?.(`❌ Xato: ${data.error || 'Noma\'lum xato'}`);
      }
    } catch {
      haptic('error');
      tg.current?.showAlert?.('❌ Tarmoq xatosi. Qayta urinib ko\'ring.');
    } finally {
      setBuying(false);
    }
  };

  const pageImg = (n: number) => `${BOT_API_URL}/api/works/${work.id}/page/${n}`;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-[#F2F2F7] px-4 pt-5 pb-3 flex items-start gap-3">
        <button
          onClick={() => { haptic('select'); router.back(); }}
          className="w-9 h-9 rounded-xl bg-black/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <ChevronLeft size={20} className="text-black/60" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-black leading-snug">{work.title}</h1>
          <p className="text-[11px] text-black/35 mt-0.5">
            {WORK_TYPE_LABELS[work.work_type] ?? work.work_type}
            {work.subject ? ` · ${work.subject}` : ''}
          </p>
        </div>
      </div>

      <div className="px-4 pb-32 space-y-4">
        {/* Hero preview (page 1) */}
        {previewCount > 0 ? (
          <button
            onClick={() => { haptic('select'); setActivePage(1); }}
            className="w-full rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pageImg(1)}
              alt={`${work.title} preview`}
              className="w-full h-auto"
            />
          </button>
        ) : (
          <div className="w-full h-44 rounded-2xl bg-blue-50 flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <BookMarked size={40} className="text-blue-400" />
            <span className="text-[13px] font-semibold text-blue-500">
              {WORK_TYPE_LABELS[work.work_type] ?? work.work_type}
            </span>
            <span className="text-[10px] text-blue-400">Preview tayyorlanmoqda</span>
          </div>
        )}

        {/* All pages grid */}
        {previewCount > 1 && (
          <div>
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">
              Barcha sahifalar ({previewCount})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: previewCount }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    onClick={() => { haptic('select'); setActivePage(n); }}
                    className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pageImg(n)} alt={`Sahifa ${n}`} className="w-full h-full object-cover bg-white" loading="lazy" />
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
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-0">
          {[
            { label: 'Fan', value: work.subject || '—' },
            { label: 'Turi', value: WORK_TYPE_LABELS[work.work_type] ?? work.work_type },
            { label: 'Sahifalar', value: `${work.page_count} ta` },
            { label: 'Til', value: LANG_LABELS[work.language] ?? work.language },
          ].map((row, i) => (
            <div key={i}>
              {i > 0 && <div className="h-px bg-black/[0.04] my-3" />}
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-black/50">{row.label}</span>
                <span className="text-[13px] font-semibold text-black">{row.value}</span>
              </div>
            </div>
          ))}
          <div className="h-px bg-black/[0.04] my-3" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-black/50">Narxi</span>
            <span className="text-[15px] font-bold text-orange-500">
              {work.price.toLocaleString()} so'm
            </span>
          </div>
        </div>

        {/* Balance */}
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

        {/* Description */}
        {work.description ? (
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] font-semibold text-black mb-2">Tavsif</p>
            <p className="text-[12px] text-black/50 leading-relaxed">{work.description}</p>
          </div>
        ) : null}

        {/* What you get */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] font-semibold text-black mb-3">Nima olasiz?</p>
          {[
            { icon: FileText, text: "To'liq tayyor ish fayli" },
            { icon: BookMarked, text: `${work.page_count} ta sahifa` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <item.icon size={14} className="text-orange-500" />
              </div>
              <span className="text-[12px] text-black/60">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-[68px] left-0 right-0 px-4 pb-3">
        <button
          onClick={handleBuy}
          disabled={buying}
          className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-60 ${
            canAfford
              ? 'bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.4)]'
              : 'bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)]'
          }`}
        >
          {buying ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : canAfford ? (
            `${work.price.toLocaleString()} so'm — Sotib olish`
          ) : (
            <>
              <Lock size={16} />
              Balansni to&apos;ldirish →
            </>
          )}
        </button>
      </div>

      {/* Lightbox */}
      {activePage !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={() => setActivePage(null)}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-[13px] font-semibold">Sahifa {activePage} / {previewCount}</span>
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pageImg(activePage)} alt={`Sahifa ${activePage}`} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={e => { e.stopPropagation(); setActivePage(Math.max(1, activePage - 1)); }}
              disabled={activePage <= 1}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-[12px] font-semibold disabled:opacity-30"
            >
              ‹ Orqaga
            </button>
            <button
              onClick={e => { e.stopPropagation(); setActivePage(Math.min(previewCount, activePage + 1)); }}
              disabled={activePage >= previewCount}
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
