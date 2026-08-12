import { cn } from '../../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[24px] w-[39px] shrink-0 items-center rounded-full',
        'transition-colors duration-200 focus-ring',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--toggle-track-on)] focus-visible:ring-offset-2',
        checked
          ? disabled
            ? 'bg-[var(--toggle-track-on-disabled)] border-0'
            : 'bg-[var(--toggle-track-on)] border-0'
          : disabled
            ? 'bg-[var(--toggle-track-off-disabled)] border-2 border-[var(--toggle-border-off-disabled)]'
            : 'bg-[var(--toggle-track-off)] border-2 border-[var(--toggle-border-off)]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 h-[16px] w-[16px] rounded-full',
          'transition-all duration-200 ease-in-out',
          checked
            ? 'bg-[var(--toggle-thumb-on)]'
            : disabled
              ? 'bg-[var(--toggle-thumb-disabled)]'
              : 'bg-[var(--toggle-thumb-off)]',
        )}
        style={{
          left: '4px',
          transform: `translate(${checked ? 15 : 0}px, -50%)`,
        }}
      />
    </button>
  );
}
