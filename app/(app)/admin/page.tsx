'use client';

import { useEffect, useRef, useState } from 'react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { Upload, Trash2, RefreshCw } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  category: string;
  slide_count: number;
  price: number;
  is_premium: boolean;
  preview_url: string | null;
}

const CATEGORIES = [
  { id: 'business',  label: 'Biznes' },
  { id: 'education', label: "Ta'lim" },
  { id: 'creative',  label: 'Ijodiy' },
  { id: 'general',   label: 'Umumiy' },
];

export default function AdminPage() {
  const tg = useRef(getTelegramWebApp());
  const [tid, setTid] = useState<number | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [price, setPrice] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');
    const id = getTelegramId();
    setTid(id);
    if (id) loadTemplates();
    else setLoading(false);
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.ok) setTemplates(data.templates);
    } catch {}
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file || !tid) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name || file.name.replace(/\.pptx$/i, ''));
    fd.append('category', category);
    fd.append('price', price || '0');
    fd.append('telegram_id', String(tid));

    setUploading(true);
    haptic('medium');
    try {
      const res = await fetch('/api/admin/upload-template', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(`✅ Yuklandi! ${data.slide_count} ta slayd preview yaratildi`);
        setName(''); setPrice('0'); setFile(null);
        const input = document.getElementById('pptx-input') as HTMLInputElement | null;
        if (input) input.value = '';
        haptic('success');
        loadTemplates();
      } else {
        setError(data.error || 'Xatolik yuz berdi');
        haptic('error');
      }
    } catch {
      setError('Server bilan aloqa uzildi');
      haptic('error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!tid) return;
    if (!confirm("Shablonni o'chirish?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}?telegram_id=${tid}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) loadTemplates();
    } finally { setDeleting(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tid) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[18px] font-bold text-black">Bot orqali oching</h2>
        <p className="text-[13px] text-black/40 mt-2">Admin panel uchun Telegram bot menyusidan keling</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-black/[0.05]">
        <h1 className="text-[20px] font-bold text-black">Admin Panel</h1>
        <p className="text-[12px] text-black/35 mt-0.5">Shablonlarni boshqarish</p>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Upload form */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
          <p className="text-[14px] font-bold text-black mb-3">Yangi shablon yuklash</p>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-black/50 uppercase tracking-wide">Nomi</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Masalan: Modern Business Pitch"
                className="w-full mt-1 px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-black/50 uppercase tracking-wide">Kategoriya</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-black/50 uppercase tracking-wide">Narxi (so&apos;m)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="0"
                  className="w-full mt-1 px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-black/50 uppercase tracking-wide">PPTX fayl</label>
              <input
                id="pptx-input"
                type="file"
                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full mt-1 px-3 py-2.5 bg-black/[0.04] rounded-xl text-[13px] outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-orange-100 file:text-orange-700 file:text-[12px] file:font-semibold"
              />
              {file && (
                <p className="text-[11px] text-black/40 mt-1">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-[12px] text-red-600">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-[12px] text-green-600">{success}</div>
            )}
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-[14px] disabled:opacity-50 disabled:bg-black/30 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Yuklanmoqda… (1-2 daq)
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Yuklash va preview yaratish
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing templates */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider">Shablonlar ({templates.length})</p>
            <button onClick={loadTemplates} className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center">
              <RefreshCw size={12} className="text-black/40" />
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="bg-white rounded-2xl py-10 text-center text-[13px] text-black/35">
              Hali shablonlar yo&apos;q
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-black/5 overflow-hidden flex-shrink-0">
                    {t.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/20 text-xs">Yo&apos;q</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-black truncate">{t.name}</p>
                    <p className="text-[11px] text-black/35">
                      {t.slide_count} slayd · {t.price > 0 ? `${t.price.toLocaleString()} so'm` : 'Bepul'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center disabled:opacity-50"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
