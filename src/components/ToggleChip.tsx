interface ToggleChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function ToggleChip({ label, active, onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
  );
}
