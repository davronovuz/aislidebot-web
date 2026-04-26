'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { Layers, BookMarked, ChevronRight, Star, Lock } from 'lucide-react';

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

interface ReadyWork {
  id: number;
  title: string;
  subject: string;
  work_type: string;
  page_count: number;
  price: number;
  preview_available: boolean;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  mustaqil_ish: 'Mustaqil ish',
  referat:      'Referat',
  kurs_ishi:    'Kurs ishi',
  diplom:       'Diplom ishi',
  magistr:      'Magistr',
};

export default function MarketplacePage() {
  const tg     = useRef(getTelegramWebApp());
  const tid    = useRef(getTelegramId());
  const router = useRouter();

  const [tab, setTab]             = useState<'templates' | 'works'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [works, setWorks]         = useState<ReadyWork[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#F2F2F7');
    tg.current?.setBackgroundColor('#F2F2F7');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, wRes] = await Promise.all([
        fetch('/api/templates').then(r => r.json()),
        fetch('/api/ready-works').then(r => r.json()),
      ]);
      if (tRes.ok) setTemplates(tRes.templates ?? []);
      if (wRes.ok) setWorks(wRes.works ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-[#F2F2F7] px-4 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-black">Bozor</h1>
        <p className="text-[12px] text-black/35 mt-0.5">Shablonlar va tayyor ishlar</p>

        {/* Tabs */}
        <div className="flex bg-black/[0.06] rounded-xl p-1 mt-3">
          {([
            { key: 'templates', icon: Layers,     label: 'Shablonlar'   },
            { key: 'works',     icon: BookMarked,  label: 'Tayyor ishlar' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => { haptic('select'); setTab(t.key); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200',
                tab === t.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-black/40'
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {tab === 'templates' ? (
          <TemplateGrid
            templates={templates}
            loading={loading}
            onSelect={id => { haptic('medium'); router.push(`/marketplace/template/${id}`); }}
          />
        ) : (
          <WorksList
            works={works}
            loading={loading}
            onSelect={id => { haptic('medium'); router.push(`/marketplace/work/${id}`); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Template Grid ────────────────────────────────────────────────────────────

function TemplateGrid({
  templates, loading, onSelect,
}: {
  templates: Template[];
  loading: boolean;
  onSelect: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="h-32 bg-black/5" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 bg-black/5 rounded-lg w-3/4" />
              <div className="h-3 bg-black/5 rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return <ComingSoon icon="🎨" title="Shablonlar" desc="Admin yangi shablonlar yuklayapti. Tez orada!" />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-1">
      {templates.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-left active:scale-[0.97] transition-transform"
        >
          {/* Preview */}
          <div className="h-32 relative flex items-center justify-center"
               style={{ background: t.colors || 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
            {t.preview_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/40 text-4xl font-bold">A</span>
            )}
            {t.is_premium && (
              <div className="absolute top-2 right-2 bg-orange-500 rounded-lg px-1.5 py-0.5 flex items-center gap-0.5">
                <Star size={9} className="text-white" fill="white" />
                <span className="text-white text-[9px] font-bold">PRO</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <p className="text-[13px] font-bold text-black leading-snug">{t.name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-black/35">{t.slide_count} slayd</span>
              <span className="text-[12px] font-bold text-orange-500">
                {t.price > 0 ? `${t.price.toLocaleString()} so'm` : 'Bepul'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Works List ───────────────────────────────────────────────────────────────

function WorksList({
  works, loading, onSelect,
}: {
  works: ReadyWork[];
  loading: boolean;
  onSelect: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2.5 mt-1">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-black/5 rounded-lg w-3/4 mb-2" />
            <div className="h-3 bg-black/5 rounded-lg w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (works.length === 0) {
    return <ComingSoon icon="📚" title="Tayyor ishlar" desc="Tez orada tayyor ishlar bozori ochiladi!" />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04] mt-1">
      {works.map(w => (
        <button
          key={w.id}
          onClick={() => onSelect(w.id)}
          className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-black/[0.02]"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BookMarked size={16} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-black leading-snug truncate">{w.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-black/35">
                {WORK_TYPE_LABELS[w.work_type] ?? w.work_type}
              </span>
              <span className="text-black/15">·</span>
              <span className="text-[10px] text-black/35">{w.page_count} bet</span>
              {w.subject && (
                <>
                  <span className="text-black/15">·</span>
                  <span className="text-[10px] text-black/35 truncate">{w.subject}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[13px] font-bold text-orange-500">{w.price.toLocaleString()}</span>
            <span className="text-[9px] text-black/25">so'm</span>
            {!w.preview_available && (
              <Lock size={10} className="text-black/20" />
            )}
          </div>
          <ChevronRight size={14} className="text-black/20 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

function ComingSoon({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mb-4">
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-[16px] font-bold text-black">{title}</p>
      <p className="text-[13px] text-black/35 mt-2 max-w-[220px] leading-relaxed">{desc}</p>
      <div className="mt-4 px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl">
        <p className="text-[11px] text-orange-500 font-medium">🔔 Tez orada!</p>
      </div>
    </div>
  );
}
