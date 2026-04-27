'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const qs = params.toString();
    const suffix = qs ? `?${qs}` : '';
    const type = params.get('type');

    let target = '/home';
    if (type === 'presentation') target = `/create/presentation${suffix}`;
    else if (type) target = `/create/${type.replace(/_/g, '-')}${suffix}`;

    router.replace(target);
  }, [params, router]);

  return null;
}

export default function RootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7]" />}>
      <RedirectInner />
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
      </div>
    </Suspense>
  );
}
