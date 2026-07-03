'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, X } from 'lucide-react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { BOT_API_URL } from '@/lib/constants';

interface PendingWork {
  id: number;
  title: string;
  subject: string;
  work_type: string;
  page_count: number;
  price: number;
  description: string;
  preview_available: boolean;
  seller_telegram_id: number;
  seller_name: string | null;
  created_at: string | null;
}

export default function AdminModerationPage() {
  const router = useRouter();
  const tg = useRef(getTelegramWebApp());
  const tid = useRef(getTelegramId());

  const [works, setWorks] = useState<PendingWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    const id = tid.current;
    if (!id) { setLoading(false); return; }
    fetch(`/api/admin/pending-works?telegram_id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setWorks(d.works ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    load();
  }, [load]);

  const moderate = async (workId: number, action: 'approve' | 'reject') => {
    const id = tid.current;
    if (!id || busyId) return;

    let note = '';
    if (action === 'reject') {
      note = window.prompt('Rad etish sababi (sotuvchiga yuboriladi):') ?? '';
      if (note === '' && !window.confirm('Sababsiz rad etilsinmi?')) return;
    }

    haptic('medium');
    setBusyId(workId);
    try {
      const fd = new FormData();
      fd.append('work_id', String(workId));
      fd.append('telegram_id', String(id));
      fd.append('action', action);
      fd.append('note', note);
      const res = await fetch('/api/admin/moderate-work', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        haptic('success');
        setWorks(ws => ws.filter(w => w.id !== workId));
      } else {
        haptic('error');
        alert(data.error || 'Xatolik');
      }
    } catch {
      haptic('error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-20">
      <div className="sticky top-0 z-10 bg-[#F2F2F7]/90 backdrop-blur-lg px-4 pt-4 pb-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full active:bg-black/5">
          <ChevronLeft className="w-6 h-6 text-black/60" />
        </button>
        <div>
          <h1 className="text-[19px] font-bold text-black leading-tight">Moderatsiya</h1>
          <p className="text-[12px] text-black/40">{works.length} ta ish tekshiruvni kutmoqda</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading && (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />)}
          </div>
        )}

        {!loading && works.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-[15px] font-medium text-black/60">Hammasi tekshirilgan</p>
            <p className="text-[12px] text-black/30 mt-1">Yangi ishlar kelganda shu yerda ko&apos;rinadi</p>
          </div>
        )}

        {works.map(w => (
          <div key={w.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            {w.preview_available && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${BOT_API_URL}/api/works/${w.id}/preview`}
                alt=""
                className="w-full h-40 object-cover object-top bg-black/5"
              />
            )}
            <div className="p-4">
              <p className="text-[15px] font-semibold text-black leading-snug">{w.title}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-black/45">
                <span>📖 {w.subject || w.work_type}</span>
                <span>📄 {w.page_count} bet</span>
                <span>💰 {w.price.toLocaleString()} so&apos;m</span>
                <span>👤 {w.seller_name || w.seller_telegram_id}</span>
              </div>
              {w.description && (
                <p className="text-[12px] text-black/50 mt-2 leading-relaxed line-clamp-3">{w.description}</p>
              )}
              <div className="flex gap-2 mt-3.5">
                <button
                  onClick={() => moderate(w.id, 'approve')}
                  disabled={busyId === w.id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-[13px] font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Tasdiqlash
                </button>
                <button
                  onClick={() => moderate(w.id, 'reject')}
                  disabled={busyId === w.id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-[13px] font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Rad etish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
