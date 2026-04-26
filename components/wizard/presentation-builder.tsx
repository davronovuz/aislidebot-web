'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Minus, Plus, Sparkles, Check, RotateCcw, Pencil, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/shared/progress-bar';
import { PriceCard } from '@/components/shared/price-card';
import { THEMES, LANGUAGES } from '@/lib/constants';
import { getTelegramId, getTelegramWebApp, haptic, getSourceParam } from '@/lib/telegram';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Slide, PresentationOutline, Language } from '@/types';

interface PriceInfo {
  balance: number;
  free: number;
  pricePerSlide: number;
}

export default function PresentationBuilder({ priceInfo }: { priceInfo: PriceInfo }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'input' | 'building' | 'done'>('input');
  const [inputStep, setInputStep] = useState<1 | 2>(1);

  // Real balance (fetched from API, overrides URL param)
  const [balance, setBalance] = useState(priceInfo.balance);
  const [freeLeft, setFreeLeft] = useState(priceInfo.free);

  // Input state
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [slideCount, setSlideCount] = useState(10);
  const [themeId, setThemeId] = useState('blues');
  const [lang, setLang] = useState<Language>('uz');

  // Generation state
  const [outline, setOutline] = useState<PresentationOutline | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [genIndex, setGenIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Send state
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const tg = useRef(getTelegramWebApp());
  const telegramId = useRef<number | null>(getTelegramId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLTextAreaElement>(null);
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const tgApp = tg.current;
    if (tgApp) {
      tgApp.ready();
      tgApp.expand();
      tgApp.setHeaderColor('#ffffff');
      tgApp.setBackgroundColor('#F2F2F7');
    }
    // Retry telegram ID
    let iv: ReturnType<typeof setInterval> | undefined;
    if (!telegramId.current) {
      let tries = 0;
      iv = setInterval(() => {
        const id = getTelegramId();
        if (id) { telegramId.current = id; clearInterval(iv); fetchBalance(id); }
        else if (++tries >= 20) clearInterval(iv);
      }, 150);
    } else {
      fetchBalance(telegramId.current);
    }
    return () => { if (iv) clearInterval(iv); };
  }, []);

  const fetchBalance = (tid: number) => {
    fetch(`/api/user-info?telegram_id=${tid}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setBalance(d.balance);
          setFreeLeft(d.free_presentations ?? 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (phase === 'building' && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [slides, genIndex, phase]);

  // ── Generation ──
  const startGeneration = useCallback(async () => {
    setPhase('building');
    setError(null);
    setGenIndex(-1);
    setSlides([]);

    try {
      const outlineData = await api.generateOutline({ topic, details, slideCount, language: lang });
      setOutline(outlineData);

      const skeletons: Slide[] = outlineData.slides.map((s, i) => ({
        slide_number: i + 1, title: s.title,
        content: null, bullet_points: null, image_keywords: null, image: null, status: 'pending',
      }));
      setSlides(skeletons);

      for (let i = 0; i < outlineData.slides.length; i++) {
        setGenIndex(i);
        const slideData = await api.generateSlide({
          topic,
          slideTitle: outlineData.slides[i].title,
          slideNumber: i + 1,
          totalSlides: outlineData.slides.length,
          language: lang,
          keyPoints: outlineData.slides[i].key_points,
          presentationTitle: outlineData.title,
        });

        setSlides(prev => prev.map((s, idx) =>
          idx === i ? { ...s, ...slideData, status: 'content' as const } : s
        ));

        if (slideData.image_keywords) {
          api.fetchImage(slideData.image_keywords)
            .then(img => setSlides(prev => prev.map((s, idx) =>
              idx === i ? { ...s, image: img, status: 'ready' as const } : s
            )))
            .catch(() => {});
        }
      }

      haptic('success');
      setPhase('done');
    } catch (err) {
      setError((err as Error).message);
      haptic('error');
    }
  }, [topic, details, slideCount, lang]);

  // ── Regenerate single slide ──
  const regenerateSlide = useCallback(async (index: number) => {
    if (!outline) return;
    haptic('medium');
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, status: 'regenerating' as const } : s));
    try {
      const slideData = await api.generateSlide({
        topic,
        slideTitle: outline.slides[index].title,
        slideNumber: index + 1,
        totalSlides: outline.slides.length,
        language: lang,
        keyPoints: outline.slides[index].key_points,
        presentationTitle: outline.title,
      });
      setSlides(prev => prev.map((s, i) =>
        i === index ? { ...s, ...slideData, status: 'ready' as const } : s
      ));
    } catch {
      setSlides(prev => prev.map((s, i) => i === index ? { ...s, status: 'error' as const } : s));
      haptic('error');
    }
  }, [outline, topic, lang]);

  // ── Send to bot ──
  const handleSend = useCallback(async () => {
    haptic('success');
    setIsSending(true);
    setSendError(null);
    try {
      const tid = telegramId.current ?? getTelegramId();
      const data = {
        telegram_id: tid,
        source: getSourceParam(),
        topic,
        details: details || '',
        slide_count: slides.length,
        theme_id: themeId,
        language: lang,
        pre_generated: true,
        title: outline?.title ?? topic,
        subtitle: outline?.subtitle ?? '',
        slides: slides.map(s => ({
          slide_number: s.slide_number,
          title: s.title,
          content: s.content,
          bullet_points: s.bullet_points,
          image_keywords: s.image_keywords,
          image_url: s.image?.url ?? null,
        })),
      };

      if (!tid) {
        console.log('Dev mode — telegram_id not found', data);
        alert('Dev mode: ' + JSON.stringify(data).slice(0, 200));
        setIsSending(false);
        return;
      }

      const result = await api.submitPresentation(data);
      if (result.ok) {
        tg.current?.close();
      } else {
        throw new Error('Submit failed');
      }
    } catch (err) {
      setIsSending(false);
      haptic('error');
      const msg = (err as Error).message ?? '';
      if (msg.includes('insufficient_balance')) {
        router.push('/profile');
        return;
      }
      setSendError(msg || 'Xatolik yuz berdi');
    }
  }, [slides, outline, topic, details, themeId, lang, router]);

  // ───────────────────────────────────────
  // INPUT PHASE
  // ───────────────────────────────────────
  if (phase === 'input') {
    const canNext = topic.trim().length >= 3;
    const isFree = freeLeft > 0;
    const totalPrice = priceInfo.pricePerSlide * slideCount;
    const canAfford = isFree || balance >= totalPrice;

    // Step 1: Topic
    if (inputStep === 1) {
      return (
        <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
          <Header title="Prezentatsiya" step={1} totalSteps={2} />

          <main className="flex-1 px-4 py-5">
            <h2 className="text-[21px] font-bold text-black">Mavzuni yozing</h2>
            <p className="text-[13px] text-black/40 mt-1">Prezentatsiya nima haqida bo&apos;lsin?</p>

            <div className="mt-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
              <textarea
                ref={topicRef}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                autoFocus
                placeholder="Masalan: Sun'iy intellektning ta'lim sohasidagi o'rni"
                rows={4}
                className="w-full text-[15px] text-black placeholder-black/25 outline-none resize-none bg-transparent leading-relaxed"
              />
            </div>
            {topic.length > 0 && topic.length < 3 && (
              <p className="text-[12px] text-orange-500 mt-2 ml-1">Kamida 3 ta belgi</p>
            )}
            {topic.length >= 3 && (
              <p className="text-[12px] text-green-500 mt-2 ml-1 flex items-center gap-1">
                <Check size={14} /> Tayyor
              </p>
            )}

            <div className="mt-4 rounded-2xl px-4 py-3 border bg-blue-50/80 border-blue-100">
              <p className="text-[11px] text-blue-600 leading-relaxed">
                💡 Mavzuni aniq va to&apos;liq yozing. Batafsil bo&apos;lsa — yaxshi natija chiqadi.
              </p>
            </div>
          </main>

          <BottomBar>
            <Button
              variant="primary"
              className="flex-1 h-[52px]"
              disabled={!canNext}
              onClick={() => { haptic('light'); setInputStep(2); }}
            >
              Davom etish <ChevronRight size={16} />
            </Button>
          </BottomBar>
        </div>
      );
    }

    // Step 2: Settings
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
        <Header title="Prezentatsiya" step={2} totalSteps={2} onBack={() => setInputStep(1)} />

        <main className="flex-1 px-4 py-5 space-y-2.5 overflow-y-auto">
          <h2 className="text-[21px] font-bold text-black">Sozlamalar</h2>
          <p className="text-[13px] text-black/40 mt-1 mb-4">Slaydlar soni, mavzu va theme</p>

          {/* Qo'shimcha ma'lumot */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4">
            <label className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">
              Qo&apos;shimcha ma&apos;lumot <span className="text-black/20">(ixtiyoriy)</span>
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Auditoriya, maxsus talablar, mavzuning qo'shimcha jihatlari..."
              rows={2}
              className="w-full mt-2 text-[14px] text-black placeholder-black/20 outline-none resize-none bg-transparent leading-relaxed"
            />
          </div>

          {/* Slaydlar soni */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
            <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Slaydlar soni</span>
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => { haptic('light'); setSlideCount(c => Math.max(5, c - 1)); }}
                className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center active:bg-black/10"
              >
                <Minus size={18} className="text-black/50" />
              </button>
              <div className="text-center">
                <span className="text-4xl font-bold text-black tabular-nums">{slideCount}</span>
                <p className="text-[10px] text-black/30 mt-0.5">5–30 slayd</p>
              </div>
              <button
                onClick={() => { haptic('light'); setSlideCount(c => Math.min(30, c + 1)); }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200"
              >
                <Plus size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Til */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
            <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Til</span>
            <div className="flex gap-2 mt-2.5">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => { haptic('select'); setLang(l.id); }}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5',
                    lang === l.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                      : 'bg-black/5 text-black/50'
                  )}
                >
                  <span>{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-4 py-4">
            <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Dizayn</span>
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { haptic('select'); setThemeId(t.id); }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all',
                    themeId === t.id ? 'bg-orange-50 ring-2 ring-orange-400' : 'hover:bg-black/5'
                  )}
                >
                  <div
                    className="w-10 h-7 rounded-lg shadow-sm"
                    style={{ background: t.titleBg }}
                  />
                  <span className="text-[9px] font-medium text-black/50 text-center leading-tight">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Narx */}
          <PriceCard
            price={totalPrice}
            balance={balance}
            isFree={isFree}
            freeLeft={freeLeft}
          />
        </main>

        <BottomBar>
          <button
            onClick={() => setInputStep(1)}
            className="w-14 h-[52px] rounded-2xl bg-black/5 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-black/50" />
          </button>
          {canAfford ? (
            <Button
              variant="primary"
              className="flex-1 h-[52px]"
              onClick={() => { haptic('medium'); startGeneration(); }}
            >
              <Sparkles size={16} /> Yaratish
            </Button>
          ) : (
            <button
              onClick={() => { haptic('medium'); router.push('/profile'); }}
              className="flex-1 h-[52px] rounded-2xl bg-red-500 text-white font-semibold text-[15px]"
            >
              Balansni to'ldirish →
            </button>
          )}
        </BottomBar>
      </div>
    );
  }

  // ───────────────────────────────────────
  // BUILDING PHASE
  // ───────────────────────────────────────
  if (phase === 'building') {
    const doneCount = slides.filter(s => s.status !== 'pending').length;
    const progress = slides.length > 0 ? (doneCount / slides.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
        <div className="bg-white px-4 pt-4 pb-3 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-[16px] font-bold text-black">Yaratilmoqda...</h1>
              <p className="text-[11px] text-black/35 mt-0.5">
                {genIndex >= 0 ? `Slayd ${genIndex + 1}/${slides.length}` : 'Struktura tayyorlanmoqda'}
              </p>
            </div>
            <span className="text-[13px] font-bold text-orange-500">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} className="mt-3" />
        </div>

        <main className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-[13px] text-red-600">❌ {error}</p>
              <button
                onClick={() => { setPhase('input'); setError(null); }}
                className="mt-2 text-[12px] font-semibold text-red-500 underline"
              >
                Qaytib ketish
              </button>
            </div>
          )}

          {slides.map((slide, i) => (
            <SlideCard key={i} slide={slide} index={i} theme={theme} isCurrent={genIndex === i} />
          ))}

          {genIndex === -1 && slides.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="text-orange-500 animate-spin" />
              <p className="text-[14px] font-medium text-black/50">Struktura tayyorlanmoqda...</p>
            </div>
          )}

          <div ref={bottomRef} />
        </main>
      </div>
    );
  }

  // ───────────────────────────────────────
  // DONE PHASE
  // ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      <div className="bg-white px-4 pt-4 pb-3 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-[16px] font-bold text-black">Tayyor! ✨</h1>
            <p className="text-[11px] text-black/35 mt-0.5">{slides.length} ta slayd yaratildi</p>
          </div>
          <div
            className="w-8 h-5 rounded-md shadow-sm"
            style={{ background: theme.titleBg }}
          />
        </div>
        <ProgressBar value={100} color="green" className="mt-3" />
      </div>

      <main className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {slides.map((slide, i) => (
          <SlideCard
            key={i}
            slide={slide}
            index={i}
            theme={theme}
            isCurrent={false}
            onRegenerate={() => regenerateSlide(i)}
          />
        ))}
        <div ref={bottomRef} />
      </main>

      <BottomBar>
        {sendError && (
          <p className="text-[12px] text-red-500 text-center mb-2 w-full">{sendError}</p>
        )}
        <button
          onClick={() => { setPhase('input'); }}
          className="w-14 h-[52px] rounded-2xl bg-black/5 flex items-center justify-center"
        >
          <RotateCcw size={18} className="text-black/50" />
        </button>
        <Button
          variant="primary"
          className="flex-1 h-[52px] bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200"
          loading={isSending}
          onClick={handleSend}
        >
          <Send size={16} /> Yuborish
        </Button>
      </BottomBar>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Header({
  title, step, totalSteps, onBack,
}: {
  title: string; step: number; totalSteps: number; onBack?: () => void;
}) {
  return (
    <header className="bg-white px-4 pt-4 pb-3 border-b border-black/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-black/60" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
            <Sparkles size={16} className="text-white" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-[16px] font-bold text-black">{title}</h1>
          <p className="text-[11px] text-black/35 mt-0.5">Bosqich {step} / {totalSteps}</p>
        </div>
      </div>
      <ProgressBar value={(step / totalSteps) * 100} className="mt-3" />
    </header>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-t border-black/5 px-4 py-3 pb-8">
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

function SlideCard({
  slide, index, theme, isCurrent, onRegenerate,
}: {
  slide: Slide;
  index: number;
  theme: typeof THEMES[0];
  isCurrent: boolean;
  onRegenerate?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = slide.status === 'pending' || slide.status === 'generating' || slide.status === 'regenerating';

  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-all',
      isCurrent && 'ring-2 ring-orange-400'
    )}>
      {/* Slide title bar */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: theme.titleBg }}>
        <span className="text-[11px] font-bold text-white/60 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
        <p className="flex-1 text-[13px] font-semibold text-white leading-tight line-clamp-1">
          {slide.title}
        </p>
        {isLoading ? (
          <Loader2 size={14} className="text-white/60 animate-spin flex-shrink-0" />
        ) : (
          <div className="flex items-center gap-1">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"
              >
                <RotateCcw size={12} className="text-white/70" />
              </button>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"
            >
              {expanded
                ? <X size={12} className="text-white/70" />
                : <Pencil size={12} className="text-white/70" />
              }
            </button>
          </div>
        )}
      </div>

      {/* Bullet points (always visible if content ready) */}
      {slide.bullet_points && !expanded && (
        <div className="px-4 py-3 space-y-1.5">
          {slide.bullet_points.slice(0, 3).map((bp, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: theme.accent }} />
              <p className="text-[12px] text-black/60 leading-relaxed line-clamp-2">{bp}</p>
            </div>
          ))}
        </div>
      )}

      {/* Expanded full content */}
      {expanded && slide.content && (
        <div className="px-4 py-3">
          <p className="text-[12px] text-black/60 leading-relaxed mb-3">{slide.content}</p>
          {slide.bullet_points?.map((bp, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: theme.accent }} />
              <p className="text-[12px] text-black/60 leading-relaxed">{bp}</p>
            </div>
          ))}
        </div>
      )}

      {/* Skeleton */}
      {isLoading && (
        <div className="px-4 py-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 bg-black/5 rounded-full animate-pulse" style={{ width: `${75 - i * 15}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
