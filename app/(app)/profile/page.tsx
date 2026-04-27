'use client';

import { useEffect, useState, useRef } from 'react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { Wallet, Star, ArrowDownLeft, ArrowUpRight, ChevronRight, Crown, Zap } from 'lucide-react';

interface UserInfo {
  balance: number;
  free_presentations: number;
  total_spent: number;
  total_deposited: number;
  member_since: string;
  price_per_slide: number;
  price_per_page: number;
  username: string | null;
  first_name: string | null;
  subscription: {
    plan_name: string;
    display_name: string;
    expires_at: string;
    presentations_used: number;
    max_presentations: number;
    courseworks_used: number;
    max_courseworks: number;
    max_slides: number;
  } | null;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const [errored, setErrored] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (photoUrl && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        onError={() => setErrored(true)}
        className="w-20 h-20 rounded-[28px] object-cover shadow-xl shadow-orange-200"
      />
    );
  }
  return (
    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-200">
      <span className="text-white text-3xl font-bold">{initials}</span>
    </div>
  );
}

export default function ProfilePage() {
  const tg = useRef(getTelegramWebApp());
  const telegramId = useRef(getTelegramId());

  const [user, setUser] = useState(tg.current?.initDataUnsafe?.user);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');
  }, []);

  useEffect(() => {
    const loadFor = (tid: number) => {
      Promise.all([
        fetch(`/api/user-info?telegram_id=${tid}`).then(r => r.json()),
        fetch(`/api/user-transactions?telegram_id=${tid}&limit=10`).then(r => r.json()),
      ]).then(([info, trans]) => {
        if (info.ok) setUserInfo(info);
        if (trans.ok) setTransactions(trans.transactions);
      }).catch(() => {}).finally(() => setLoading(false));
    };

    if (telegramId.current) {
      loadFor(telegramId.current);
      return;
    }

    // Telegram WebApp may not have populated initDataUnsafe yet — retry briefly
    let tries = 0;
    const iv = setInterval(() => {
      const id = getTelegramId();
      const u = tg.current?.initDataUnsafe?.user;
      if (u) setUser(u);
      if (id) { telegramId.current = id; clearInterval(iv); loadFor(id); }
      else if (++tries >= 20) { clearInterval(iv); setLoading(false); }
    }, 150);
    return () => clearInterval(iv);
  }, []);

  const name = user
    ? `${user.first_name ?? ''}${user.last_name ? ' ' + user.last_name : ''}`.trim() || (user.username ?? 'Foydalanuvchi')
    : (userInfo?.first_name || userInfo?.username || 'Foydalanuvchi');
  const username = user?.username ?? userInfo?.username;

  if (!loading && !userInfo) {
    const debug = {
      tg: !!tg.current,
      tgUser: !!tg.current?.initDataUnsafe?.user,
      tid: telegramId.current,
      ls: typeof window !== 'undefined' ? window.localStorage?.getItem('aislide_telegram_id') : null,
      url: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('telegram_id') : null,
      initData: tg.current?.initData ? tg.current.initData.slice(0, 80) + '...' : null,
      hash: typeof window !== 'undefined' ? window.location.hash.slice(0, 80) : null,
      pathname: typeof window !== 'undefined' ? window.location.pathname : null,
    };
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mb-4">
          <span className="text-4xl">🤖</span>
        </div>
        <h2 className="text-[18px] font-bold text-black">Telegram orqali oching</h2>
        <p className="text-[13px] text-black/40 mt-2 max-w-[280px] leading-relaxed">
          Profilingizni ko&apos;rish uchun bot menyusidan <b>📊 Prezentatsiya</b> yoki <b>📝 Mustaqil ish</b> tugmasini bosing.
        </p>
        <pre className="mt-4 text-[10px] text-black/40 bg-white rounded-lg px-3 py-2 text-left">{JSON.stringify(debug, null, 2)}</pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2.5 bg-orange-500 rounded-xl text-white text-[13px] font-semibold"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7]">
        <div className="px-4 pt-6 space-y-4">
          <div className="flex items-center gap-4 px-2">
            <div className="w-20 h-20 rounded-[28px] bg-white animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-36 bg-white rounded-xl animate-pulse" />
              <div className="h-3 w-24 bg-white rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="h-36 bg-white rounded-3xl animate-pulse" />
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const balance = userInfo?.balance ?? 0;
  const sub = userInfo?.subscription;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-5 border-b border-black/[0.05]">
        <div className="flex items-center gap-4">
          <Avatar name={name} photoUrl={user?.photo_url} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-bold text-black truncate">{name}</h1>
            {username && (
              <p className="text-[13px] text-black/35 mt-0.5">@{username}</p>
            )}
            {userInfo?.member_since && (
              <p className="text-[11px] text-black/25 mt-1">
                A&apos;zo: {formatDate(userInfo.member_since)}
              </p>
            )}
          </div>
          {sub && (
            <div className="flex-shrink-0 px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md shadow-orange-200">
              <Crown size={14} className="text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-5 shadow-xl shadow-orange-200">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={13} className="text-orange-200" />
              <p className="text-orange-100 text-[11px] font-semibold uppercase tracking-widest">Balans</p>
            </div>
            <p className="text-white text-[40px] font-bold leading-none">
              {balance.toLocaleString()}
              <span className="text-[18px] text-orange-200 font-medium ml-1.5">so&apos;m</span>
            </p>

            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <p className="text-orange-200 text-[10px]">To&apos;ldirilgan</p>
                <p className="text-white text-[13px] font-bold">{(userInfo?.total_deposited ?? 0).toLocaleString()}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="flex-1">
                <p className="text-orange-200 text-[10px]">Sarflangan</p>
                <p className="text-white text-[13px] font-bold">{(userInfo?.total_spent ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        {sub ? (
          <div>
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">Obuna</p>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-4 py-4 border-b border-black/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <Zap size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-black">{sub.display_name}</p>
                      <p className="text-[11px] text-black/35">Tugash: {formatDate(sub.expires_at)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg">
                    Aktiv
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black/[0.04]">
                <div className="px-4 py-3.5">
                  <p className="text-[10px] text-black/30 uppercase tracking-wider">Prezentatsiya</p>
                  <p className="text-[15px] font-bold text-black mt-0.5">
                    {sub.max_presentations >= 999 ? '♾' : `${sub.presentations_used}/${sub.max_presentations}`}
                  </p>
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-[10px] text-black/30 uppercase tracking-wider">Ilmiy ish</p>
                  <p className="text-[15px] font-bold text-black mt-0.5">
                    {sub.max_courseworks >= 999 ? '♾' : `${sub.courseworks_used}/${sub.max_courseworks}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Narxlar */}
        {userInfo && (
          <div>
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">Narxlar</p>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <p className="text-[13px] font-medium text-black">1 ta slayd</p>
                </div>
                <p className="text-[13px] font-bold text-black">{userInfo.price_per_slide.toLocaleString()} so&apos;m</p>
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <p className="text-[13px] font-medium text-black">1 ta sahifa</p>
                </div>
                <p className="text-[13px] font-bold text-black">{userInfo.price_per_page.toLocaleString()} so&apos;m</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions */}
        {transactions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">Tranzaksiyalar</p>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
              {transactions.map((t, i) => {
                const isIn = t.type === 'deposit';
                const isRefund = t.type === 'refund';
                return (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      isIn || isRefund ? 'bg-green-50' : 'bg-red-50'
                    )}>
                      {isIn || isRefund
                        ? <ArrowDownLeft size={15} className="text-green-500" />
                        : <ArrowUpRight size={15} className="text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-black truncate">{t.description || 'Tranzaksiya'}</p>
                      <p className="text-[11px] text-black/30 mt-0.5">{formatDate(t.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-[13px] font-bold',
                        isIn || isRefund ? 'text-green-500' : 'text-red-400'
                      )}>
                        {isIn || isRefund ? '+' : '-'}{t.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-black/25">so&apos;m</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
