import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

const base = [
  'inline-flex items-center gap-2 font-medium transition-all duration-200',
  'focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
  'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
].join(' ');

const variantStyles: Record<Variant, string> = {
  primary: [
    'border border-transparent !text-white',
    'bg-[var(--btn-primary-bg)]',
    'hover:bg-[var(--btn-primary-hover-bg)]',
    'active:bg-[var(--btn-primary-active-bg)]',
    'focus-visible:ring-[var(--btn-primary-ring)]',
  ].join(' '),
  secondary: [
    'border border-[var(--btn-secondary-border)]',
    'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)]',
    'hover:bg-[var(--btn-secondary-hover-bg)] hover:border-[var(--btn-secondary-hover-bd)]',
    'active:bg-[var(--btn-secondary-active-bg)]',
    'focus-visible:ring-[var(--btn-secondary-ring)]',
    'disabled:bg-[var(--btn-secondary-disabled-bg)] disabled:border-[var(--btn-secondary-disabled-bd)] disabled:!text-[var(--btn-secondary-disabled-fg)]',
  ].join(' '),
  ghost: [
    'border border-transparent',
    'bg-transparent text-[var(--btn-tertiary-fg)]',
    'hover:bg-[var(--btn-tertiary-hover-bg)]',
    'active:bg-[var(--btn-tertiary-active-bg)]',
    'focus-visible:ring-[var(--btn-secondary-ring)]',
  ].join(' '),
  danger: [
    'border border-[var(--btn-warning-bg)]',
    'bg-[var(--field-bg)] text-[var(--btn-warning-bg)]',
    'hover:bg-[var(--color-surface-error-subtle)]',
    'focus-visible:ring-[var(--btn-warning-ring)]',
  ].join(' '),
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(base, variantStyles[variant], sizeStyles[size], className)}
    >
      {loading && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
