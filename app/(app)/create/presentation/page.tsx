'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PresentationBuilder = dynamic(
  () => import('@/components/wizard/presentation-builder'),
  { ssr: false }
);

function PresentationInner() {
  const params = useSearchParams();
  const priceInfo = {
    balance: parseFloat(params.get('balance') ?? '0'),
    free: parseInt(params.get('free') ?? '0', 10),
    pricePerSlide: parseFloat(params.get('price') ?? '500'),
  };
  return <PresentationBuilder priceInfo={priceInfo} />;
}

export default function PresentationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7]" />}>
      <PresentationInner />
    </Suspense>
  );
}
