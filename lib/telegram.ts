'use client';

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  initDataUnsafe?: { user?: { id: number; username?: string; first_name?: string; last_name?: string } };
  initData?: string;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  colorScheme?: 'light' | 'dark';
  isExpanded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramId(): number | null {
  const tg = getTelegramWebApp();

  // 1. initDataUnsafe
  const uid = tg?.initDataUnsafe?.user?.id;
  if (uid) return uid;

  // 2. initData parse
  if (tg?.initData) {
    try {
      const u = new URLSearchParams(tg.initData).get('user');
      if (u) return JSON.parse(decodeURIComponent(u)).id;
    } catch {}
  }

  if (typeof window === 'undefined') return null;

  // 3. URL param (bot keyboard orqali)
  const urlParam = new URLSearchParams(window.location.search).get('telegram_id');
  if (urlParam) return parseInt(urlParam, 10);

  // 4. Hash (Telegram Desktop)
  try {
    const hp = new URLSearchParams(window.location.hash.replace('#', ''));
    const d = hp.get('tgWebAppData');
    if (d) {
      const u = new URLSearchParams(d).get('user');
      if (u) return JSON.parse(decodeURIComponent(u)).id;
    }
  } catch {}

  return null;
}

export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'select' = 'light') {
  try {
    const tg = getTelegramWebApp();
    if (!tg?.HapticFeedback) return;
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
    else if (type === 'select') tg.HapticFeedback.selectionChanged();
    else tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
  } catch {}
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);
}

export function getSourceParam(): string {
  if (typeof window === 'undefined') return 'aislide';
  return new URLSearchParams(window.location.search).get('source') ?? 'aislide';
}

export function getPriceInfo() {
  if (typeof window === 'undefined') return { balance: 0, free: 0, pricePerSlide: 500, pricePerPage: 500 };
  const p = new URLSearchParams(window.location.search);
  return {
    balance: parseFloat(p.get('balance') ?? '0'),
    free: parseInt(p.get('free') ?? '0', 10),
    pricePerSlide: parseFloat(p.get('price') ?? '500'),
    pricePerPage: parseFloat(p.get('price') ?? '500'),
  };
}
