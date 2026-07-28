import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Accent = 'navy' | 'teal' | 'purple' | 'neutral';

const accentBorder: Record<Accent, string> = {
  navy: 'border-navy/30 bg-navy/[0.04]',
  teal: 'border-teal/30 bg-teal/[0.05]',
  purple: 'border-purple/30 bg-purple/[0.05]',
  neutral: 'border-charcoal/15 bg-white',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

export function Card({ className, accent = 'neutral', ...props }: CardProps) {
  return (
    <div
      className={cn('border p-6', accentBorder[accent], className)}
      {...props}
    />
  );
}
