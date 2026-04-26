'use client';

import { useEffect, useRef, Suspense } from 'react';
import { PRODUCTS } from '@/lib/constants';
import { getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

export default function CreatePage() {
  const tg = useRef(getTelegramWebApp());

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');
  }, []);

  const presentations = PRODUCTS.filter(p => p.category === 'presentation');
  const documents = PRODUCTS.filter(p => p.category === 'document');
  const creative = PRODUCTS.filter(p => p.category === 'creative');

  const navigate = (id: string) => {
    haptic('medium');
    window.location.href = `/create/${id.replace(/_/g, '-')}`;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <header className="bg-white px-4 pt-4 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
            <span className="text-white text-lg">✨</span>
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-black">AI Yaratish</h1>
            <p className="text-[11px] text-black/35">Nima yaratmoqchisiz?</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 space-y-5">
        <Section title="📊 Prezentatsiya">
          {presentations.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(p.id)} />
          ))}
        </Section>

        <Section title="📚 Ilmiy ishlar">
          {documents.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(p.id)} />
          ))}
        </Section>

        <Section title="🎨 Ijodiy">
          {creative.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(p.id)} />
          ))}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="space-y-2">{children}</div>
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
        'w-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4',
        'flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform'
      )}
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{product.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-black">{product.name}</p>
        <p className="text-[12px] text-black/40 mt-0.5 truncate">{product.desc}</p>
      </div>
      <span className="text-black/20 text-lg flex-shrink-0">›</span>
    </button>
  );
}
