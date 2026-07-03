'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Wallet, FileText, AlertTriangle, Check, X, RefreshCw, Search } from 'lucide-react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

interface Stats {
  users: { total: number; today: number; week: number; month: number };
  revenue: { today: number; week: number; month: number; total: number };
  deposits: { today: number; month: number; total: number };
  tasks: { total: number; today: number; by_status: Record<string, number>; by_type_month: { type: string; count: number }[] };
  pending_payments: number;
  marketplace: { active_works: number; pending_moderation: number; templates: number; total_sales: number };
  recent_failures: { task_uuid: string; type: string; telegram_id: number; error: string; created_at: string }[];
}

interface Tx {
  id: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  user_telegram_id: number;
  user_name: string;
  created_at: string;
}

interface AdminUser {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  balance: number;
  total_spent: number;
  total_deposited: number;
  is_blocked: boolean;
  created_at: string;
}

const fmt = (n: number) => n.toLocaleString('uz-UZ');

export default function AdminDashboardPage() {
  const router = useRouter();
  const tg = useRef(getTelegramWebApp());
  const tid = useRef(getTelegramId());

  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingTxs, setPendingTxs] = useState<Tx[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyTx, setBusyTx] = useState<number | null>(null);
  const [section, setSection] = useState<'overview' | 'payments' | 'users'>('overview');

  const loadAll = useCallback(() => {
    const id = tid.current;
    if (!id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/dashboard-stats?telegram_id=${id}`).then(r => r.json()),
      fetch(`/api/admin/transactions?telegram_id=${id}&status=pending`).then(r => r.json()),
      fetch(`/api/admin/users?telegram_id=${id}`).then(r => r.json()),
    ]).then(([s, t, u]) => {
      if (s.ok) setStats(s);
      if (t.ok) setPendingTxs((t.transactions ?? []).filter((x: Tx) => x.type === 'deposit'));
      if (u.ok) { setUsers(u.users ?? []); setUsersTotal(u.total ?? 0); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    loadAll();
  }, [loadAll]);

  const searchUsers = async (q: string) => {
    const id = tid.current;
    if (!id) return;
    const res = await fetch(`/api/admin/users?telegram_id=${id}&q=${encodeURIComponent(q)}`);
    const d = await res.json();
    if (d.ok) { setUsers(d.users ?? []); setUsersTotal(d.total ?? 0); }
  };

  const actTx = async (txId: number, action: 'approve' | 'reject') => {
    const id = tid.current;
    if (!id || busyTx) return;
    let comment = '';
    if (action === 'reject') comment = window.prompt('Rad etish sababi:') ?? '';
    haptic('medium');
    setBusyTx(txId);
    try {
      const fd = new FormData();
      fd.append('transaction_id', String(txId));
      fd.append('telegram_id', String(id));
      fd.append('action', action);
      fd.append('comment', comment);
      const res = await fetch('/api/admin/transaction-action', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        haptic('success');
        setPendingTxs(txs => txs.filter(t => t.id !== txId));
        loadAll();
      } else {
        haptic('error');
        alert(data.detail || data.error || 'Xatolik');
      }
    } finally {
      setBusyTx(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F2F2F7]/90 backdrop-blur-lg px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full active:bg-black/5">
            <ChevronLeft className="w-6 h-6 text-black/60" />
          </button>
          <h1 className="text-[19px] font-bold text-black flex-1">Dashboard</h1>
          <button onClick={() => { haptic('light'); loadAll(); }} className="p-2 rounded-full active:bg-black/5">
            <RefreshCw className={cn('w-4.5 h-4.5 text-black/50', loading && 'animate-spin')} />
          </button>
        </div>
        {/* Section tabs */}
        <div className="flex bg-black/[0.06] rounded-xl p-1 mt-2.5">
          {([
            { key: 'overview', label: 'Umumiy' },
            { key: 'payments', label: `To'lovlar${pendingTxs.length ? ` (${pendingTxs.length})` : ''}` },
            { key: 'users', label: 'Userlar' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => { haptic('select'); setSection(t.key); }}
              className={cn(
                'flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition-all',
                section === t.key ? 'bg-white text-black shadow-sm' : 'text-black/40',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* ── OVERVIEW ── */}
        {section === 'overview' && (
          <>
            {loading && !stats && (
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
              </div>
            )}

            {stats && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCard icon={<Users className="w-4 h-4 text-blue-500" />} label="Userlar"
                    value={fmt(stats.users.total)} sub={`bugun +${stats.users.today} · hafta +${stats.users.week}`} />
                  <StatCard icon={<Wallet className="w-4 h-4 text-green-500" />} label="Daromad (oy)"
                    value={`${fmt(stats.revenue.month)}`} sub={`bugun ${fmt(stats.revenue.today)} so'm`} />
                  <StatCard icon={<FileText className="w-4 h-4 text-purple-500" />} label="Ishlar"
                    value={fmt(stats.tasks.total)} sub={`bugun ${stats.tasks.today} ta`} />
                  <StatCard icon={<Wallet className="w-4 h-4 text-amber-500" />} label="Kirim (jami)"
                    value={fmt(stats.deposits.total)} sub={`oy: ${fmt(stats.deposits.month)} so'm`} />
                </div>

                {/* Payments needing attention */}
                {stats.pending_payments > 0 && (
                  <button
                    onClick={() => setSection('payments')}
                    className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-2.5 active:scale-[0.99]"
                  >
                    <span className="text-lg">💳</span>
                    <p className="text-[13px] font-semibold text-amber-700 flex-1 text-left">
                      {stats.pending_payments} ta to&apos;lov tasdiqlashni kutmoqda
                    </p>
                    <ChevronLeft className="w-4 h-4 text-amber-400 rotate-180" />
                  </button>
                )}
                {stats.marketplace.pending_moderation > 0 && (
                  <a href="/admin/moderation"
                    className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-2.5 active:scale-[0.99]">
                    <span className="text-lg">🛎</span>
                    <p className="text-[13px] font-semibold text-blue-700 flex-1">
                      {stats.marketplace.pending_moderation} ta ish moderatsiya kutmoqda
                    </p>
                    <ChevronLeft className="w-4 h-4 text-blue-400 rotate-180" />
                  </a>
                )}

                {/* Task statuses */}
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
                  <p className="text-[10px] font-semibold text-black/35 uppercase tracking-wider mb-2.5">Task holatlari</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(stats.tasks.by_status).map(([s, c]) => (
                      <span key={s} className={cn(
                        'text-[11px] font-semibold px-2.5 py-1.5 rounded-full',
                        s === 'completed' ? 'bg-green-50 text-green-600'
                          : s === 'failed' ? 'bg-red-50 text-red-500'
                          : s === 'processing' ? 'bg-blue-50 text-blue-600'
                          : 'bg-black/5 text-black/50',
                      )}>
                        {s}: {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Popular products (30 kun) */}
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
                  <p className="text-[10px] font-semibold text-black/35 uppercase tracking-wider mb-2.5">Mahsulotlar (30 kun)</p>
                  {stats.tasks.by_type_month.map(t => (
                    <div key={t.type} className="flex items-center justify-between py-1.5">
                      <span className="text-[13px] text-black/70">{t.type}</span>
                      <span className="text-[13px] font-semibold text-black">{t.count}</span>
                    </div>
                  ))}
                </div>

                {/* Marketplace */}
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
                  <p className="text-[10px] font-semibold text-black/35 uppercase tracking-wider mb-2.5">Marketplace</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[17px] font-bold text-black">{stats.marketplace.active_works}</p><p className="text-[10px] text-black/40">Sotuvda</p></div>
                    <div><p className="text-[17px] font-bold text-black">{stats.marketplace.templates}</p><p className="text-[10px] text-black/40">Shablonlar</p></div>
                    <div><p className="text-[17px] font-bold text-black">{stats.marketplace.total_sales}</p><p className="text-[10px] text-black/40">Sotuvlar</p></div>
                  </div>
                </div>

                {/* Problems */}
                {stats.recent_failures.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Muammolar (48 soat)
                    </p>
                    <div className="space-y-2.5">
                      {stats.recent_failures.map(f => (
                        <div key={f.task_uuid} className="border-l-2 border-red-200 pl-2.5">
                          <p className="text-[12px] font-medium text-black/70">{f.type} · <span className="text-black/40">{f.telegram_id}</span></p>
                          <p className="text-[11px] text-red-400 leading-snug mt-0.5">{f.error || 'Xato matni yo\'q'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── PAYMENTS ── */}
        {section === 'payments' && (
          <>
            {pendingTxs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-[15px] font-medium text-black/60">Kutayotgan to&apos;lov yo&apos;q</p>
              </div>
            )}
            {pendingTxs.map(t => (
              <div key={t.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[16px] font-bold text-black">{fmt(t.amount)} so&apos;m</p>
                    <p className="text-[12px] text-black/45 mt-0.5">
                      {t.user_name} · <span className="font-mono">{t.user_telegram_id}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-black/30">{t.created_at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                {t.description && <p className="text-[12px] text-black/50 mt-1.5">{t.description}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => actTx(t.id, 'approve')}
                    disabled={busyTx === t.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-[13px] font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Tasdiqlash
                  </button>
                  <button
                    onClick={() => actTx(t.id, 'reject')}
                    disabled={busyTx === t.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-[13px] font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Rad etish
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── USERS ── */}
        {section === 'users' && (
          <>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-4 py-3 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-black/30 shrink-0" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }}
                placeholder="Username, ism yoki Telegram ID..."
                className="flex-1 text-[14px] text-black placeholder-black/25 outline-none bg-transparent"
              />
            </div>
            <p className="text-[11px] text-black/35 px-1">Jami: {fmt(usersTotal)} ta user</p>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.telegram_id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-black">
                      {u.first_name || u.username || u.telegram_id}
                      {u.is_blocked && <span className="ml-1.5 text-[10px] text-red-400">🚫 bloklangan</span>}
                    </p>
                    <span className="text-[13px] font-bold text-green-600">{fmt(u.balance)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-black/40">
                    <span className="font-mono">{u.telegram_id}</span>
                    {u.username && <span>@{u.username}</span>}
                    <span>sarf: {fmt(u.total_spent)}</span>
                    <span>kirim: {fmt(u.total_deposited)}</span>
                    <span>{u.created_at.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-3.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[19px] font-bold text-black mt-1.5 leading-tight">{value}</p>
      <p className="text-[10.5px] text-black/35 mt-0.5">{sub}</p>
    </div>
  );
}
