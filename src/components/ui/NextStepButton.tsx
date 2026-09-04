interface NextStepButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  /** 완료 안내 문구. 주어지면 버튼과 함께 카드로 감싸 렌더한다(4개 체험 유형 공통 디자인). */
  message?: string;
}

export function NextStepButton({ onClick, label, disabled, message }: NextStepButtonProps) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-subtle"
    >
      {label ?? "다음으로 넘어가기"}
    </button>
  );

  if (!message) return button;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-medium text-muted">{message}</p>
      {button}
    </div>
  );
}
