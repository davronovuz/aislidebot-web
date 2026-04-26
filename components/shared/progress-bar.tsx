'use client';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: 'orange' | 'green' | 'blue';
}

const COLORS = {
  orange: 'from-orange-400 via-orange-500 to-orange-600',
  green:  'from-green-400 via-green-500 to-emerald-600',
  blue:   'from-blue-400 via-blue-500 to-indigo-600',
};

export function ProgressBar({ value, className, color = 'orange' }: ProgressBarProps) {
  return (
    <div className={cn('h-1.5 bg-black/8 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out', COLORS[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
