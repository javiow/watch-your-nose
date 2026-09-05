import type { ExperienceFormatMeta } from "@/data/experience-format";

interface FormatBadgeProps {
  format: ExperienceFormatMeta;
}

/**
 * 체험 화면 상단에 "지금 무슨 형식인지"를 알려주는 pill 배지.
 * 사기 유형명이 아니라 상호작용 형식(전화 통화/현장 조사 등)만 보여준다.
 */
export function FormatBadge({ format }: FormatBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-muted">
      <span aria-hidden="true" className="text-sm leading-none">
        {format.icon}
      </span>
      <span className="font-semibold text-foreground">{format.formatLabel}</span>
      <span className="text-subtle">{format.hint}</span>
    </span>
  );
}
