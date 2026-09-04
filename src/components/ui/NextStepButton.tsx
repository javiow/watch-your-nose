interface NextStepButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export function NextStepButton({ onClick, label, disabled }: NextStepButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle"
    >
      {label ?? "다음으로 넘어가기"}
    </button>
  );
}
