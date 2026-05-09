'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PremiumTemplate } from '@/types';

interface Props {
  template: PremiumTemplate | null;
  selected: boolean;
  onClose: () => void;
  onSelect: () => void;
}

/**
 * Fullscreen template preview — PowerPoint-like slideshow.
 * - Smooth Push transitions between slides (Framer Motion x-axis)
 * - Keyboard nav: ←/→/Esc/Enter
 * - Page indicators
 * - Big "Bu shablonni tanlash" CTA at bottom
 */
export function TemplatePreviewModal({ template, selected, onClose, onSelect }: Props) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1=forward, -1=back
  const slides = template?.preview_slides ?? [];

  // Reset to first slide when template changes
  useEffect(() => { setIdx(0); }, [template?.file]);

  const next = useCallback(() => {
    setDirection(1);
    setIdx((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIdx((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard nav
  useEffect(() => {
    if (!template) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter') onSelect();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [template, next, prev, onClose, onSelect]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (!template) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [template]);

  // Push (slide-x) animation variants
  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 80 + '%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: -dir * 80 + '%', opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {template && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between gap-3 px-5 py-4 text-white"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{template.emoji}</span>
                <span className="truncate text-base font-semibold">{template.name}</span>
              </div>
              <div className="truncate text-[11px] text-white/60">{template.description}</div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>
          </motion.div>

          {/* Slide stage */}
          <div
            className="relative flex-1 flex items-center justify-center px-3 sm:px-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev button */}
            {slides.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-1 sm:left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25"
                aria-label="Oldingi"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Slide canvas (16:9) */}
            <div className="relative w-full max-w-[1100px] aspect-video bg-white rounded-xl shadow-2xl overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={idx}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: 'spring', stiffness: 260, damping: 28 }, opacity: { duration: 0.25 } }}
                  className="absolute inset-0"
                >
                  {slides[idx] && (
                    <Image
                      src={slides[idx]}
                      alt={`${template.name} slide ${idx + 1}`}
                      fill
                      priority
                      sizes="(max-width: 1100px) 100vw, 1100px"
                      className="object-contain"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Next button */}
            {slides.length > 1 && (
              <button
                onClick={next}
                className="absolute right-1 sm:right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25"
                aria-label="Keyingi"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Footer: indicators + CTA */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="px-5 py-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Page dots */}
            {slides.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); }}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                    )}
                    aria-label={`Slayd ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={onSelect}
              className={cn(
                'mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl px-6 py-3.5',
                'text-[15px] font-bold transition-all duration-200',
                selected
                  ? 'bg-white text-black/85'
                  : 'bg-orange-500 text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] hover:bg-orange-600 active:scale-95'
              )}
            >
              {selected ? (
                <><Check size={18} strokeWidth={3} /> Tanlangan — yopish</>
              ) : (
                <>Bu shablonni tanlash</>
              )}
            </button>
            <div className="text-center text-[10px] text-white/40">
              ← → klavishlari bilan slaydlarni almashtiring · Esc — yopish
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
