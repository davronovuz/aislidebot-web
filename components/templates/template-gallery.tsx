'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateCard } from './template-card';
import { TemplatePreviewModal } from './template-preview-modal';
import type { PremiumTemplate } from '@/types';

interface Props {
  templates: PremiumTemplate[];
  selectedFile: string | null;
  onSelect: (file: string | null) => void;
  /** Optional haptic feedback callback (Telegram WebApp). */
  onHaptic?: () => void;
}

/**
 * Grid of template cards with hover-to-cycle preview + click-to-expand modal.
 *
 * Layout:
 * - Mobile (<640px): 1 column
 * - Small tablet (640–768): 2 columns
 * - Desktop (>=768): 2 columns (cards stay large enough to read previews)
 */
export function TemplateGallery({ templates, selectedFile, onSelect, onHaptic }: Props) {
  const [expanded, setExpanded] = useState<PremiumTemplate | null>(null);

  if (templates.length === 0) return null;

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {templates.map((t) => (
          <motion.div
            key={t.file}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <TemplateCard
              template={t}
              selected={selectedFile === t.file}
              onSelect={() => {
                onHaptic?.();
                // Toggle: re-clicking selected card deselects
                onSelect(selectedFile === t.file ? null : t.file);
              }}
              onExpand={() => setExpanded(t)}
            />
          </motion.div>
        ))}
      </motion.div>

      <TemplatePreviewModal
        template={expanded}
        selected={!!expanded && selectedFile === expanded.file}
        onClose={() => setExpanded(null)}
        onSelect={() => {
          if (!expanded) return;
          onHaptic?.();
          if (selectedFile === expanded.file) {
            // Already selected → close
            setExpanded(null);
          } else {
            onSelect(expanded.file);
            setExpanded(null);
          }
        }}
      />
    </>
  );
}
