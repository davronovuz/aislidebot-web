'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import { getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export default function CreatePage() {
  const tg = useRef(getTelegramWebApp());
  const router = useRouter();

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
    if (id === 'presentation') router.push('/create/presentation');
    else router.push(`/create/${id.replace(/_/g, '-')}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-black/[0.05]">
        <h1 className="text-[20px] font-bold text-black">Nima yaratamiz?</h1>
        <p className="text-[12px] text-black/35 mt-0.5">AI orqali professional kontent</p>
      </div>

      <div className="px-4 py-4 space-y-5">
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

        {creative.length > 0 && (
          <Section title="🎨 Ijodiy">
            {creative.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(p.id)} />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
        {children}
      </div>
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
        'w-full px-4 py-3.5 flex items-center gap-3.5 text-left',
        'active:bg-black/[0.02] transition-colors'
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
        <span className="text-[20px]">{product.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-black">{product.name}</p>
        <p className="text-[12px] text-black/35 mt-0.5 truncate">{product.desc}</p>
      </div>
      <ChevronRight size={16} className="text-black/20 flex-shrink-0" />
    </button>
  );
}
