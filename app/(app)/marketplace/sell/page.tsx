'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

interface MyWork {
  id: number;
  title: string;
  work_type: string;
  page_count: number;
  price: number;
  moderation_status: string;
  moderation_note: string | null;
  sales_count: number;
}

const WORK_TYPES = [
  { id: 'mustaqil_ish', label: 'Mustaqil ish' },
  { id: 'referat', label: 'Referat' },
  { id: 'kurs_ishi', label: 'Kurs ishi' },
  { id: 'diplom_ishi', label: 'Diplom ishi' },
  { id: 'presentation', label: 'Prezentatsiya' },
  { id: 'boshqa', label: 'Boshqa' },
];

const STATUS_META: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending:  { label: 'Tekshirilmoqda', cls: 'bg-amber-50 text-amber-600',   Icon: Clock },
  approved: { label: 'Sotuvda',        cls: 'bg-green-50 text-green-600',   Icon: CheckCircle2 },
  rejected: { label: 'Rad etilgan',    cls: 'bg-red-50 text-red-500',       Icon: XCircle },
};

export default function SellWorkPage() {
  const router = useRouter();
  const tg = useRef(getTelegramWebApp());
  const tid = useRef(getTelegramId());

  const [title, setTitle] = useState('');
  const [workType, setWorkType] = useState('mustaqil_ish');
  const [subject, setSubject] = useState('');
  const [price, setPrice] = useState(10000);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [myWorks, setMyWorks] = useState<MyWork[]>([]);

  const loadMyWorks = useCallback(() => {
    const id = tid.current;
    if (!id) return;
    fetch(`/api/marketplace/my-works?telegram_id=${id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMyWorks(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    loadMyWorks();
  }, [loadMyWorks]);

  const canSubmit = title.trim().length >= 5 && file && price >= 1000 && !submitting;

  const handleSubmit = async () => {
    const id = tid.current ?? getTelegramId();
    if (!id || !file || !canSubmit) return;
    haptic('light');
    setSubmitting(true);
    setMessage(null);

    const fd = new FormData();
    fd.append('telegram_id', String(id));
    fd.append('title', title.trim());
    fd.append('subject', subject.trim());
    fd.append('work_type', workType);
    fd.append('price', String(price));
    fd.append('description', description.trim());
    fd.append('file', file);

    try {
      const res = await fetch('/api/marketplace/sell', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.ok) {
        haptic('success');
        setMessage({ ok: true, text: "✅ Ish yuborildi! Admin tekshirgach sotuvga chiqadi — sizga xabar keladi." });
        setTitle(''); setSubject(''); setDescription(''); setFile(null); setPrice(10000);
        loadMyWorks();
      } else {
        haptic('error');
        setMessage({ ok: false, text: data.detail || data.error || 'Xatolik yuz berdi' });
      }
    } catch {
      haptic('error');
      setMessage({ ok: false, text: 'Server bilan aloqa uzildi. Qayta urinib ko\'ring.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F2F2F7]/90 backdrop-blur-lg px-4 pt-4 pb-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full active:bg-black/5">
          <ChevronLeft className="w-6 h-6 text-black/60" />
        </button>
        <div>
          <h1 className="text-[19px] font-bold text-black leading-tight">Ish sotish</h1>
          <p className="text-[12px] text-black/40">Tayyor ishingizni yuklang — har sotuvdan daromad oling</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
          <p className="text-[12px] text-blue-700 leading-relaxed">
            💰 Ishingiz sotilganda daromad <b>balansingizga</b> tushadi (platforma komissiyasi ayirilgan holda).
            Admin tekshiruvidan o&apos;tgan ishlar katalogda ko&apos;rinadi.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Ish nomi *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masalan: Iqtisodiyot nazariyasi — bozor mexanizmi"
              className="w-full mt-1.5 text-[15px] text-black placeholder-black/20 outline-none bg-transparent"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Ish turi</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {WORK_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { haptic('light'); setWorkType(t.id); }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors',
                    workType === t.id ? 'bg-black text-white' : 'bg-black/5 text-black/60',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Fan (ixtiyoriy)</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Masalan: Iqtisodiyot"
              className="w-full mt-1.5 text-[15px] text-black placeholder-black/20 outline-none bg-transparent"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">
              Narx: {price.toLocaleString()} so&apos;m
            </label>
            <input
              type="range" min={1000} max={100000} step={1000}
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              className="w-full mt-2 accent-black"
            />
            <div className="flex justify-between text-[10px] text-black/30 mt-0.5">
              <span>1 000</span><span>100 000</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Tavsif (ixtiyoriy)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ish nima haqida, nechta sahifa, qaysi talablarga mos..."
              rows={3}
              className="w-full mt-1.5 text-[14px] text-black placeholder-black/20 outline-none resize-none bg-transparent leading-relaxed"
            />
          </div>

          {/* File */}
          <label className={cn(
            'flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-colors',
            file ? 'border-green-300 bg-green-50' : 'border-black/10 active:bg-black/5',
          )}>
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <FileText className="w-5 h-5 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-green-700 truncate">{file.name}</p>
                  <p className="text-[11px] text-green-600/70">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-black/30 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-black/60">Fayl tanlang</p>
                  <p className="text-[11px] text-black/30">PDF, DOCX yoki PPTX — 30 MB gacha</p>
                </div>
              </>
            )}
          </label>

          {message && (
            <p className={cn('text-[13px] leading-relaxed', message.ok ? 'text-green-600' : 'text-red-500')}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all',
              canSubmit ? 'bg-black text-white active:scale-[0.98]' : 'bg-black/10 text-black/30',
            )}
          >
            {submitting ? 'Yuklanmoqda…' : 'Moderatsiyaga yuborish'}
          </button>
        </div>

        {/* My works */}
        {myWorks.length > 0 && (
          <div>
            <h2 className="text-[15px] font-bold text-black px-1 mt-5 mb-2">Mening ishlarim</h2>
            <div className="space-y-2">
              {myWorks.map(w => {
                const meta = STATUS_META[w.moderation_status] ?? STATUS_META.pending;
                return (
                  <div key={w.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-medium text-black leading-snug flex-1">{w.title}</p>
                      <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full shrink-0', meta.cls)}>
                        <meta.Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-black/40">
                      <span>{w.price.toLocaleString()} so&apos;m</span>
                      {w.sales_count > 0 && <span>📈 {w.sales_count} ta sotuv</span>}
                    </div>
                    {w.moderation_status === 'rejected' && w.moderation_note && (
                      <p className="text-[11px] text-red-400 mt-1.5">Sabab: {w.moderation_note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
