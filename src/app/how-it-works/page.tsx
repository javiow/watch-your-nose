import Link from "next/link";
import { Prose } from "@/components/ui/Prose";

const LEARNING_STEPS = [
  { icon: "🔍", label: "위험 신호 포착" },
  { icon: "📑", label: "서류·정보 비교" },
  { icon: "🤔", label: "판단 연습" },
] as const;

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-16">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-accent">Watch Your Nose</p>
        <h1 className="text-3xl font-bold text-foreground">
          시작하기 전에 잠깐 알려드릴게요
        </h1>
        <Prose
          className="mx-auto text-center"
          size="base"
          text={
            "코심코심은 전화·문자·온라인 거래·계약 확인처럼 일상에서 마주칠 수 있는 상황을 사전 안내 없이 체험합니다.\n\n직접 겪어 보며 내가 정말 안 속을지 점검하는 것이 목표입니다."
          }
        />
      </div>

      <ul className="flex justify-center gap-6 text-sm text-muted">
        {LEARNING_STEPS.map((step) => (
          <li key={step.label} className="flex flex-col items-center gap-2 text-center">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-xl"
            >
              {step.icon}
            </span>
            {step.label}
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <p className="text-sm font-medium text-muted">진행 방식</p>
        <ul className="space-y-2 text-sm leading-relaxed text-muted">
          <li>여러 단계로 진행됩니다.</li>
          <li>
            각 단계를 마치면 나타나는 &ldquo;다음으로 넘어가기&rdquo; 버튼을 눌러야
            다음으로 이동합니다.
          </li>
          <li>선택 직후에는 정답과 오답을 알려주지 않습니다.</li>
          <li>
            모든 단계를 마치면 결과 페이지에서 종합 점수와 유형별 점수, 문항별
            리뷰(대응 방안 포함)를 한 번에 확인합니다.
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Link
          href="/setup"
          className="min-h-11 rounded-xl bg-accent px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          시작하기
        </Link>
      </div>
    </main>
  );
}
