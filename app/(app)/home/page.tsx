'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { ChevronRight, Sparkles, BookOpen, Zap, TrendingUp, Gift } from 'lucide-react';

interface UserInfo {
  balance: number;
  free_presentations: number;
  total_spent: number;
  total_deposited: number;
  subscription: {
    plan_name: string;
    display_name: string;
    expires_at: string;
    presentations_used: number;
    max_presentations: number;
    courseworks_used: number;
    max_courseworks: number;
  } | null;
}

interface Task {
  task_uuid: string;
  type: string;
  slide_count: number;
  status: string;
  progress: number;
  amount_charged: number;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  basic: 'Prezentatsiya',
  pitch_deck: 'Pitch Deck',
  course_work: 'Kurs ishi',
  mustaqil_ish: 'Mustaqil ish',
  referat: 'Referat',
  diplom: 'Diplom ishi',
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Kutmoqda',    cls: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  processing: { label: 'Jarayonda',   cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  completed:  { label: 'Tayyor',      cls: 'bg-green-50 text-green-600 border-green-100' },
  failed:     { label: 'Xato',        cls: 'bg-red-50 text-red-600 border-red-100' },
};

function formatDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function HomePage() {
  const router = useRouter();
  const tg = useRef(getTelegramWebApp());
  const telegramId = useRef(getTelegramId());

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const user = tg.current?.initDataUnsafe?.user;

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');
  }, []);

  useEffect(() => {
    const tid = telegramId.current;
    if (!tid) { setLoading(false); return; }

    Promise.all([
      fetch(`/api/user-info?telegram_id=${tid}`).then(r => r.json()),
      fetch(`/api/user-tasks?telegram_id=${tid}&limit=3`).then(r => r.json()),
    ]).then(([info, tasks]) => {
      if (info.ok) setUserInfo(info);
      if (tasks.ok) setRecentTasks(tasks.tasks);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const navigate = (path: string) => { haptic('medium'); router.push(path); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7]">
        <div className="px-4 pt-6 space-y-4">
          <div className="h-36 bg-white rounded-3xl animate-pulse" />
          <div className="h-24 bg-white rounded-2xl animate-pulse" />
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const firstName = user?.first_name ?? 'Foydalanuvchi';
  const balance = userInfo?.balance ?? 0;
  const freeLeft = userInfo?.free_presentations ?? 0;
  const sub = userInfo?.subscription;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-5 border-b border-black/[0.05]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] text-black/35 font-medium">Xush kelibsiz 👋</p>
            <h1 className="text-[22px] font-bold text-black mt-0.5">{firstName}</h1>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
            <Sparkles size={18} className="text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-3xl p-5 shadow-xl shadow-orange-200">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-10 -translate-x-10" />
          <div className="relative">
            <p className="text-orange-100 text-[11px] font-semibold uppercase tracking-widest">Balans</p>
            <p className="text-white text-[36px] font-bold mt-1 leading-none">
              {balance.toLocaleString()}
              <span className="text-[18px] font-medium text-orange-200 ml-1.5">so&apos;m</span>
            </p>
            {freeLeft > 0 && (
              <div className="flex items-center gap-1.5 mt-3 bg-white/15 rounded-xl px-3 py-1.5 w-fit">
                <Gift size={12} className="text-orange-100" />
                <span className="text-white text-[11px] font-medium">{freeLeft} ta bepul prezentatsiya</span>
              </div>
            )}
            {sub && (
              <div className="flex items-center gap-1.5 mt-3 bg-white/15 rounded-xl px-3 py-1.5 w-fit">
                <Zap size={12} className="text-orange-100" />
                <span className="text-white text-[11px] font-medium">{sub.display_name} obuna</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">Tez yaratish</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('/create/presentation')}
              className="bg-white rounded-2xl p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-3">
                <span className="text-xl">📊</span>
              </div>
              <p className="text-[13px] font-bold text-black">Prezentatsiya</p>
              <p className="text-[11px] text-black/35 mt-0.5">PPTX fayl</p>
            </button>

            <button
              onClick={() => navigate('/create')}
              className="bg-white rounded-2xl p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-3">
                <span className="text-xl">📚</span>
              </div>
              <p className="text-[13px] font-bold text-black">Ilmiy ish</p>
              <p className="text-[11px] text-black/35 mt-0.5">DOCX / PDF</p>
            </button>
          </div>
        </div>

        {/* Stats */}
        {userInfo && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={13} className="text-green-500" />
                <span className="text-[10px] text-black/35 font-semibold uppercase tracking-wider">To&apos;ldirilgan</span>
              </div>
              <p className="text-[16px] font-bold text-black">{userInfo.total_deposited.toLocaleString()}</p>
              <p className="text-[10px] text-black/30">so&apos;m</p>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} className="text-orange-500" />
                <span className="text-[10px] text-black/35 font-semibold uppercase tracking-wider">Sarflangan</span>
              </div>
              <p className="text-[16px] font-bold text-black">{userInfo.total_spent.toLocaleString()}</p>
              <p className="text-[10px] text-black/30">so&apos;m</p>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {recentTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider">Oxirgi buyurtmalar</p>
              <button
                onClick={() => navigate('/history')}
                className="text-[11px] text-orange-500 font-semibold flex items-center gap-0.5"
              >
                Barchasi <ChevronRight size={13} />
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
              {recentTasks.map(task => {
                const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.pending;
                return (
                  <div key={task.task_uuid} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={15} className="text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-black truncate">
                        {TYPE_LABELS[task.type] ?? task.type}
                      </p>
                      <p className="text-[11px] text-black/30 mt-0.5">{formatDate(task.created_at)}</p>
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-lg border', s.cls)}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recentTasks.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-3xl mb-2">✨</p>
            <p className="text-[14px] font-semibold text-black">Hali buyurtma yo&apos;q</p>
            <p className="text-[12px] text-black/35 mt-1">Birinchi yaratishingizni boshlang!</p>
            <button
              onClick={() => navigate('/create')}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[13px] font-semibold rounded-xl shadow-md shadow-orange-200"
            >
              Yaratishni boshlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
