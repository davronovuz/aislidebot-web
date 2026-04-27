'use client';

import { useEffect, useState, useRef } from 'react';
import { getTelegramId, getTelegramWebApp, haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { ClipboardList, RefreshCw, Download } from 'lucide-react';

interface Task {
  task_uuid: string;
  type: string;
  slide_count: number;
  status: string;
  progress: number;
  amount_charged: number;
  created_at: string;
  result_file_id: string | null;
}

const TYPE_META: Record<string, { label: string; icon: string }> = {
  basic:        { label: 'Prezentatsiya',  icon: '📊' },
  pitch_deck:   { label: 'Pitch Deck',     icon: '🎯' },
  course_work:  { label: 'Kurs ishi',      icon: '📖' },
  mustaqil_ish: { label: 'Mustaqil ish',   icon: '📝' },
  referat:      { label: 'Referat',        icon: '📄' },
  diplom:       { label: 'Diplom ishi',    icon: '🎓' },
  magistr:      { label: 'Magistr',        icon: '🎓' },
  tezis:        { label: 'Tezis',          icon: '📋' },
  ilmiy_maqola: { label: 'Ilmiy maqola',   icon: '🔬' },
  krossvord:    { label: 'Krossvord',      icon: '🧩' },
};

const STATUS_STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  pending:    { label: 'Kutmoqda',  cls: 'bg-yellow-50 text-yellow-600 border-yellow-100', dot: 'bg-yellow-400' },
  processing: { label: 'Jarayon',   cls: 'bg-blue-50 text-blue-600 border-blue-100',       dot: 'bg-blue-400' },
  completed:  { label: 'Tayyor',    cls: 'bg-green-50 text-green-600 border-green-100',    dot: 'bg-green-400' },
  failed:     { label: 'Xato',      cls: 'bg-red-50 text-red-600 border-red-100',          dot: 'bg-red-400' },
};

function formatDate(dt: string) {
  const d = new Date(dt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Hozir';
  if (mins < 60) return `${mins} daq. oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days < 7) return `${days} kun oldin`;
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

function groupByDate(tasks: Task[]) {
  const groups: Record<string, Task[]> = {};
  tasks.forEach(t => {
    const d = new Date(t.created_at);
    const now = new Date();
    const diff = now.getDate() - d.getDate();
    const key = diff === 0 ? 'Bugun' : diff === 1 ? 'Kecha' : d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
}

export default function HistoryPage() {
  const tg = useRef(getTelegramWebApp());
  const telegramId = useRef(getTelegramId());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    tg.current?.ready();
    tg.current?.expand();
    tg.current?.setHeaderColor('#ffffff');
    tg.current?.setBackgroundColor('#F2F2F7');
  }, []);

  const fetchTasks = async (silent = false) => {
    const tid = telegramId.current;
    if (!tid) { setLoading(false); return; }

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/user-tasks?telegram_id=${tid}&limit=50`);
      const data = await res.json();
      if (data.ok) setTasks(data.tasks);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  const resendFile = async (taskUuid: string) => {
    const tid = telegramId.current;
    if (!tid) return;
    setResending(taskUuid);
    try {
      const res = await fetch('/api/resend-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_uuid: taskUuid, telegram_id: tid }),
      });
      const data = await res.json();
      if (data.ok) {
        haptic('success');
        tg.current?.close?.();
      } else {
        haptic('error');
      }
    } catch {
      haptic('error');
    } finally {
      setResending(null);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7]">
        <div className="bg-white px-4 pt-5 pb-4 border-b border-black/[0.05]">
          <div className="h-7 w-40 bg-black/5 rounded-xl animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-2.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-[0_2px_8px_rgba(0,0,0,0.04)]" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#F2F2F7]">
        <div className="bg-white px-4 pt-5 pb-4 border-b border-black/[0.05]">
          <h1 className="text-[20px] font-bold text-black">Buyurtmalar tarixi</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mb-4">
            <ClipboardList size={32} className="text-orange-300" />
          </div>
          <p className="text-[16px] font-bold text-black">Hali buyurtma yo&apos;q</p>
          <p className="text-[13px] text-black/35 mt-2 leading-relaxed">
            Prezentatsiya yoki ilmiy ish yaratganingizdan so&apos;ng bu yerda ko&apos;rinadi
          </p>
        </div>
      </div>
    );
  }

  const grouped = groupByDate(tasks);
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'processing').length,
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-black/[0.05]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-black">Buyurtmalar tarixi</h1>
            <p className="text-[12px] text-black/35 mt-0.5">{stats.total} ta buyurtma</p>
          </div>
          <button
            onClick={() => fetchTasks(true)}
            className={cn(
              'w-9 h-9 rounded-xl bg-black/[0.04] flex items-center justify-center',
              refreshing && 'animate-spin'
            )}
          >
            <RefreshCw size={15} className="text-black/40" />
          </button>
        </div>

        {/* Mini stats */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 text-center">
            <p className="text-[15px] font-bold text-green-600">{stats.completed}</p>
            <p className="text-[10px] text-green-500">Tayyor</p>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-xl px-3 py-2 text-center">
            <p className="text-[15px] font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-[10px] text-yellow-500">Kutmoqda</p>
          </div>
          <div className="flex-1 bg-orange-50 rounded-xl px-3 py-2 text-center">
            <p className="text-[15px] font-bold text-orange-600">{stats.total}</p>
            <p className="text-[10px] text-orange-500">Jami</p>
          </div>
        </div>
      </div>

      {/* Task list grouped by date */}
      <div className="px-4 py-4 space-y-4">
        {Object.entries(grouped).map(([dateLabel, dayTasks]) => (
          <div key={dateLabel}>
            <p className="text-[11px] font-semibold text-black/35 uppercase tracking-wider mb-2 px-1">
              {dateLabel}
            </p>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
              {dayTasks.map(task => {
                const meta = TYPE_META[task.type] ?? { label: task.type, icon: '📄' };
                const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.pending;
                return (
                  <div key={task.task_uuid} className="px-4 py-3.5 flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{meta.icon}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-black">{meta.label}</p>
                        {(task.status === 'processing' || task.status === 'pending') && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-black/30">{formatDate(task.created_at)}</span>
                        {task.slide_count > 0 && (
                          <>
                            <span className="text-black/15">·</span>
                            <span className="text-[11px] text-black/30">{task.slide_count} ta</span>
                          </>
                        )}
                      </div>
                      {task.status === 'processing' && task.progress > 0 && (
                        <div className="mt-1.5 h-1 bg-black/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status + price */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', s.cls)}>
                        {s.label}
                      </span>
                      {task.amount_charged > 0 && (
                        <span className="text-[10px] text-black/30 font-medium">
                          {task.amount_charged.toLocaleString()} so&apos;m
                        </span>
                      )}
                      {task.status === 'completed' && task.result_file_id && (
                        <button
                          onClick={() => resendFile(task.task_uuid)}
                          disabled={resending === task.task_uuid}
                          className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 px-2 py-0.5 rounded-lg bg-orange-50 active:bg-orange-100 disabled:opacity-50"
                        >
                          <Download size={10} />
                          {resending === task.task_uuid ? 'Yuborilmoqda…' : 'Yuklab olish'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
