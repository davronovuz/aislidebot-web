'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';

const TABS = [
  { href: '/home', icon: Home, label: 'Asosiy' },
  { href: '/create', icon: Plus, label: 'Yaratish' },
  { href: '/history', icon: ClipboardList, label: 'Tarix' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab = TABS.find(t =>
    t.href === '/create'
      ? pathname.startsWith('/create')
      : pathname === t.href || pathname.startsWith(t.href + '/')
  )?.href ?? '/home';

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7]">
      <div className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 backdrop-blur-xl border-t border-black/[0.06]">
          <div
            className="flex"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {TABS.map(({ href, icon: Icon, label }) => {
              const isActive = activeTab === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => haptic('light')}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
                >
                  <div className={cn(
                    'w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                    isActive ? 'bg-orange-500/10' : ''
                  )}>
                    <Icon
                      size={22}
                      className={cn(
                        'transition-colors duration-200',
                        isActive ? 'text-orange-500' : 'text-black/30'
                      )}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-orange-500' : 'text-black/30'
                  )}>
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
