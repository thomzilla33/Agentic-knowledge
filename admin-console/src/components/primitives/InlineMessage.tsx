import type { ReactNode } from 'react';

type Kind = 'info' | 'warning' | 'error' | 'success';

const styles: Record<Kind, string> = {
  info:    'bg-[var(--color-surface-alert-subtle)] border-[var(--primary)] text-[var(--primary)]',
  warning: 'bg-[var(--color-surface-alert-subtle)] border-amber-300 text-amber-900',
  error:   'bg-[var(--color-surface-error-subtle)] border-[var(--btn-warning-bg)] text-[var(--field-text-error)]',
  success: 'bg-[var(--color-surface-success-subtle)] border-emerald-300 text-[var(--field-text-success)]',
};

export function InlineMessage({ kind = 'info', children }: { kind?: Kind; children: ReactNode }) {
  return (
    <div className={`px-3 py-2.5 rounded-lg border text-sm ${styles[kind]}`} role="alert">
      {children}
    </div>
  );
}
