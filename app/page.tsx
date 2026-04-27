'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Client-side redirect to preserve URL hash (Telegram WebApp's #tgWebAppData=...).
 * Server-side redirect() would drop the hash before telegram-web-app.js can read it,
 * leaving initDataUnsafe.user empty on every subsequent page.
 */
export default function RootPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const qs = params.toString();
    const suffix = qs ? `?${qs}` : '';
    const type = params.get('type');

    let target = '/home';
    if (type === 'presentation') target = `/create/presentation${suffix}`;
    else if (type) target = `/create/${type.replace(/_/g, '-')}${suffix}`;

    // router.replace preserves hash automatically
    router.replace(target);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
    </div>
  );
}
