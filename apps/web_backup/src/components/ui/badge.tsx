import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground bg-transparent',
  };
  return (
    <div className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variants[variant], className)} {...props} />
  );
}

export { Badge };
