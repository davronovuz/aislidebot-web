'use client';

import { useEffect, useRef, useState } from 'react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { Upload, Trash2, RefreshCw, Layers, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: number;
  name: string;
  category: string;
  slide_count: number;
  price: number;
  is_premium: boolean;
  preview_url: string | null;
}

interface ReadyWork {
  id: number;
  title: string;
  subject: string;
  work_type: string;
  page_count: number;
  price: number;
  preview_available: boolean;
}

const TEMPLATE_CATEGORIES = [
  { id: 'business',  label: 'Biznes' },
  { id: 'education', label: "Ta'lim" },
  { id: 'creative',  label: 'Ijodiy' },
  { id: 'general',   label: 'Umumiy' },
];

const WORK_TYPES = [
  { id: 'mustaqil_ish', label: 'Mustaqil ish' },
  { id: 'referat',      label: 'Referat' },
  { id: 'kurs_ishi',    label: 'Kurs ishi' },
  { id: 'diplom',       label: 'Diplom ishi' },
  { id: 'magistr',      label: 'Magistr' },
  { id: 'tezis',        label: 'Tezis' },
  { id: 'ilmiy_maqola', label: 'Ilmiy maqola' },
];

const LANGUAGES = [
  { id: 'uz', label: "O'zbekcha" },
  { id: 'ru', label: 'Ruscha' },
  { id: 'en', label: 'Inglizcha' },
];

export default function AdminPage() {
  const tg = useRef(getTelegramWebApp());
  const [tid, setTid] = useState<number | null>(null);
  const [tab, setTab] = useState<'templates' | 'works'>('templates');

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');
    setTid(getTelegramId());
  }, []);

  if (tid === null) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="bg-white px-4 pt-5 pb-3 border-b border-black/[0.05]">
        <h1 className="text-[20px] font-bold text-black">Admin Panel</h1>
        <p className="text-[12px] text-black/35 mt-0.5">Mahsulotlarni boshqarish</p>
        <div className="flex bg-black/[0.06] rounded-xl p-1 mt-3">
          {([
            { key: 'templates', icon: Layers,     label: 'Shablonlar'    },
            { key: 'works',     icon: BookMarked, label: 'Tayyor ishlar' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => { haptic('select'); setTab(t.key); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold transition-all',
                tab === t.key ? 'bg-white text-black shadow-sm' : 'text-black/40'
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4">
        {tab === 'templates'
          ? <TemplatesPanel tid={tid} />
          : <WorksPanel tid={tid} />
        }
      </div>
    </div>
  );
}

// ─── Templates Panel ──────────────────────────────────────────────────────────

function TemplatesPanel({ tid }: { tid: number | null }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [price, setPrice] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.ok) setTemplates(data.templates);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
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
      const res = await fetch('/api/admin/upload-template', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setSuccess(`✅ Yuklandi! ${data.slide_count} ta slayd`);
        setName(''); setPrice('0'); setFile(null);
        const inp = document.getElementById('pptx-input') as HTMLInputElement | null;
        if (inp) inp.value = '';
        haptic('success');
        load();
      } else {
        setError(data.error || 'Xatolik'); haptic('error');
      }
    } catch { setError('Server xatosi'); haptic('error'); }
    finally { setUploading(false); }
  };

  const remove = async (id: number) => {
    if (!tid || !confirm("Shablonni o'chirish?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/templates/${id}?telegram_id=${tid}`, { method: 'DELETE' });
      load();
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
        <p className="text-[14px] font-bold text-black mb-3">Yangi shablon (.pptx)</p>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nomi">
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Modern Business Pitch"
              className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategoriya">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none">
                {TEMPLATE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Narxi (so'm)">
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0"
                className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]" />
            </Field>
          </div>
          <Field label="PPTX fayl">
            <input id="pptx-input" type="file"
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[13px] outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-orange-100 file:text-orange-700 file:text-[12px] file:font-semibold" />
            {file && <p className="text-[11px] text-black/40 mt-1">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          </Field>
          {error && <Alert kind="error">{error}</Alert>}
          {success && <Alert kind="success">{success}</Alert>}
          <SubmitButton uploading={uploading} disabled={!file || uploading} />
        </form>
      </div>

      <ItemList
        title="Shablonlar"
        loading={loading}
        items={templates}
        onRefresh={load}
        renderItem={t => (
          <div key={t.id} className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-black/5 overflow-hidden flex-shrink-0">
              {t.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-black/20 text-[10px]">Yo&apos;q</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black truncate">{t.name}</p>
              <p className="text-[11px] text-black/35">
                {t.slide_count} slayd · {t.price > 0 ? `${t.price.toLocaleString()} so'm` : 'Bepul'}
              </p>
            </div>
            <button onClick={() => remove(t.id)} disabled={deleting === t.id}
              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center disabled:opacity-50">
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        )}
      />
    </div>
  );
}

// ─── Works Panel ──────────────────────────────────────────────────────────────

function WorksPanel({ tid }: { tid: number | null }) {
  const [works, setWorks] = useState<ReadyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [workType, setWorkType] = useState('mustaqil_ish');
  const [pageCount, setPageCount] = useState('10');
  const [price, setPrice] = useState('5000');
  const [language, setLanguage] = useState('uz');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ready-works');
      const data = await res.json();
      if (data.ok) setWorks(data.works);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!file || !tid || !title) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('subject', subject);
    fd.append('work_type', workType);
    fd.append('page_count', pageCount);
    fd.append('price', price);
    fd.append('language', language);
    fd.append('description', description);
    fd.append('telegram_id', String(tid));
    setUploading(true);
    haptic('medium');
    try {
      const res = await fetch('/api/admin/upload-work', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setSuccess('✅ Yuklandi!');
        setTitle(''); setSubject(''); setDescription(''); setFile(null);
        const inp = document.getElementById('work-input') as HTMLInputElement | null;
        if (inp) inp.value = '';
        haptic('success');
        load();
      } else {
        setError(data.error || 'Xatolik'); haptic('error');
      }
    } catch { setError('Server xatosi'); haptic('error'); }
    finally { setUploading(false); }
  };

  const remove = async (id: number) => {
    if (!tid || !confirm("Ishni o'chirish?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/works/${id}?telegram_id=${tid}`, { method: 'DELETE' });
      load();
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
        <p className="text-[14px] font-bold text-black mb-3">Yangi tayyor ish (.docx / .pdf)</p>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Sarlavha">
            <input value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Sun'iy intellekt va ta'lim"
              className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]" />
          </Field>
          <Field label="Fan">
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Informatika"
              className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ish turi">
              <select value={workType} onChange={e => setWorkType(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none">
                {WORK_TYPES.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </Field>
            <Field label="Til">
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none">
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sahifalar">
              <input type="number" value={pageCount} onChange={e => setPageCount(e.target.value)} min="1"
                className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]" />
            </Field>
            <Field label="Narxi (so'm)">
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0"
                className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06]" />
            </Field>
          </div>
          <Field label="Tavsif (ixtiyoriy)">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Bu ishning qisqacha mazmuni..."
              className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[14px] outline-none focus:bg-black/[0.06] resize-none" />
          </Field>
          <Field label="Fayl (.docx, .pdf yoki .pptx)">
            <input id="work-input" type="file"
              accept=".docx,.pdf,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2.5 bg-black/[0.04] rounded-xl text-[13px] outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-orange-100 file:text-orange-700 file:text-[12px] file:font-semibold" />
            {file && <p className="text-[11px] text-black/40 mt-1">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          </Field>
          {error && <Alert kind="error">{error}</Alert>}
          {success && <Alert kind="success">{success}</Alert>}
          <SubmitButton uploading={uploading} disabled={!file || !title || uploading} />
        </form>
      </div>

      <ItemList
        title="Tayyor ishlar"
        loading={loading}
        items={works}
        onRefresh={load}
        renderItem={w => (
          <div key={w.id} className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BookMarked size={18} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black truncate">{w.title}</p>
              <p className="text-[11px] text-black/35 truncate">
                {WORK_TYPES.find(t => t.id === w.work_type)?.label ?? w.work_type}
                {w.subject ? ` · ${w.subject}` : ''}
                {' · '}{w.page_count} bet
                {' · '}{w.price.toLocaleString()} so&apos;m
              </p>
            </div>
            <button onClick={() => remove(w.id)} disabled={deleting === w.id}
              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center disabled:opacity-50">
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        )}
      />
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-black/50 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Alert({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div className={cn(
      'border rounded-xl px-3 py-2 text-[12px]',
      kind === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'
    )}>{children}</div>
  );
}

function SubmitButton({ uploading, disabled }: { uploading: boolean; disabled: boolean }) {
  return (
    <button type="submit" disabled={disabled}
      className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-[14px] disabled:opacity-50 disabled:bg-black/30 flex items-center justify-center gap-2">
      {uploading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Yuklanmoqda… (1-2 daq)
        </>
      ) : (
        <>
          <Upload size={16} />
          Yuklash
        </>
      )}
    </button>
  );
}

function ItemList<T extends { id: number }>({
  title, loading, items, onRefresh, renderItem,
}: {
  title: string;
  loading: boolean;
  items: T[];
  onRefresh: () => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider">{title} ({items.length})</p>
        <button onClick={onRefresh} className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center">
          <RefreshCw size={12} className={cn('text-black/40', loading && 'animate-spin')} />
        </button>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl py-10 text-center text-[13px] text-black/35">Yuklanmoqda…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl py-10 text-center text-[13px] text-black/35">Hali yo&apos;q</div>
      ) : (
        <div className="space-y-2">{items.map(renderItem)}</div>
      )}
    </div>
  );
}
