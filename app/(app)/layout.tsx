'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic, getTelegramId } from '@/lib/telegram';

const TABS = [
  { href: '/home',        icon: Home,          label: 'Asosiy'  },
  { href: '/marketplace', icon: ShoppingBag,   label: 'Bozor'   },
  { href: '/history',     icon: ClipboardList, label: 'Tarix'   },
  { href: '/profile',     icon: User,          label: 'Profil'  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tid = typeof window !== 'undefined' ? getTelegramId() : null;
  const tidQs = tid ? `?telegram_id=${tid}` : '';

  const activeTab = TABS.find(t =>
    pathname === t.href ||
    pathname.startsWith(t.href + '/') ||
    (t.href === '/home' && pathname.startsWith('/create'))
  )?.href ?? '/home';

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7]">
      <div className="flex-1 pb-[calc(60px+env(safe-area-inset-bottom))]">
        {children}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/92 backdrop-blur-xl border-t border-black/[0.06]"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex">
            {TABS.map(({ href, icon: Icon, label }) => {
              const isActive = activeTab === href;
              return (
                <Link
                  key={href}
                  href={`${href}${tidQs}`}
                  onClick={() => haptic('light')}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
                >
                  <div className={cn(
                    'w-11 h-6 rounded-full flex items-center justify-center transition-all duration-200',
                    isActive && 'bg-orange-500/10'
                  )}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8}
                      className={cn('transition-colors duration-200', isActive ? 'text-orange-500' : 'text-black/30')} />
                  </div>
                  <span className={cn('text-[10px] font-medium', isActive ? 'text-orange-500' : 'text-black/30')}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
