'use client';

import dynamic from 'next/dynamic';
import { useParams, useSearchParams, notFound } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import type { ProductType } from '@/types';
import { Suspense } from 'react';

const DocumentBuilder = dynamic(
  () => import('@/components/wizard/document-builder'),
  { ssr: false }
);

function DocumentInner() {
  const params = useParams();
  const searchParams = useSearchParams();

  const typeSlug = Array.isArray(params?.type) ? params.type[0] : (params?.type ?? '');
  const productId = typeSlug.replace(/-/g, '_') as ProductType;
  const product = PRODUCTS.find(p => p.id === productId);

  if (!product || product.category === 'presentation') return notFound();

  const priceInfo = {
    balance: parseFloat(searchParams.get('balance') ?? '0'),
    pricePerPage: parseFloat(searchParams.get('price') ?? '500'),
  };

  return <DocumentBuilder productType={productId} priceInfo={priceInfo} />;
}

export default function DynamicCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7]" />}>
      <DocumentInner />
    </Suspense>
  );
}
