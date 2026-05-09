'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PremiumTemplate } from '@/types';

interface Props {
  template: PremiumTemplate;
  selected: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

/**
 * Card with hover-to-cycle preview of slides.
 * - Default: shows slide 1
 * - Hover (desktop) / press-and-hold (mobile): cycles slides 1.5s each with fade
 * - Click: opens fullscreen modal
 * - Long-press / "select" CTA: picks template
 */
export function TemplateCard({ template, selected, onSelect, onExpand }: Props) {
  const slides = template.preview_slides ?? [];
  const hasPreview = slides.length > 0;
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isHovering || slides.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActiveIdx(0);
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % slides.length);
    }, 1500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isHovering, slides.length]);

  // Pre-load all slides on mount (small PNGs ~50-200KB each)
  useEffect(() => {
    if (!hasPreview) return;
    slides.forEach((src) => { const img = new (window.Image as any)(); img.src = src; });
  }, [hasPreview, slides]);

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => setTimeout(() => setIsHovering(false), 800)}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white cursor-pointer',
        'shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
        'transition-shadow duration-300',
        selected && 'ring-2 ring-orange-400'
      )}
      onClick={onExpand}
    >
      {/* Preview slide area (16:9) */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {hasPreview ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={slides[activeIdx]}
                alt={`${template.name} slide ${activeIdx + 1}`}
                fill
                priority={activeIdx === 0}
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {template.emoji}
          </div>
        )}

        {/* Slide indicator dots (only when hovering) */}
        {hasPreview && slides.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovering ? 1 : 0 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm"
          >
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === activeIdx ? 'w-4 bg-white' : 'w-1 bg-white/50'
                )}
              />
            ))}
          </motion.div>
        )}

        {/* Expand hint (top-right, on hover) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovering ? 1 : 0, scale: isHovering ? 1 : 0.8 }}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white"
        >
          <Eye size={12} /> Ko'rish
        </motion.div>

        {/* Selected badge */}
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg"
          >
            <Check size={16} strokeWidth={3} />
          </motion.div>
        )}
      </div>

      {/* Footer: name + select button */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{template.emoji}</span>
            <span className="truncate text-[13px] font-semibold text-black">{template.name}</span>
          </div>
          <div className="mt-0.5 truncate text-[10px] text-black/45">
            {template.description}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            'shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
            selected
              ? 'bg-orange-500 text-white'
              : 'bg-black/[0.06] text-black/70 hover:bg-orange-50 hover:text-orange-500'
          )}
        >
          {selected ? '✓ Tanlandi' : 'Tanlash'}
        </button>
      </div>
    </motion.div>
  );
}
