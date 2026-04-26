import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none';

    const variants = {
      primary:   'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200',
      secondary: 'bg-black/5 text-black/70 hover:bg-black/10',
      ghost:     'text-black/50 hover:bg-black/5',
      danger:    'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200',
    };

    const sizes = {
      sm: 'h-9 px-4 text-[13px]',
      md: 'h-[52px] px-6 text-[15px]',
      lg: 'h-14 px-8 text-[16px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
