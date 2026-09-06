import Link from "next/link";

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
          시작하기 전에 잠깐! 👀
        </h1>
        <div className="mx-auto max-w-prose space-y-3 text-base leading-relaxed text-muted">
          <p>
            코심코심은 전화, 문자, 온라인 거래, 계약처럼
            <br />
            <span className="inline-block pl-4">
              일상에서 마주치는 금융 사기 상황을 체험해보는 서비스입니다.
            </span>
          </p>
          <p>
            여러 사기 수법을 직접 겪어 보고, 위험 신호를 알아보는 눈을 기르는 것이
            목표입니다.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <p className="text-sm font-medium text-muted">코심코심? 🐘</p>
        <p className="text-sm leading-relaxed text-muted">
          도시에 갓 상경한 코심이는 &ldquo;눈 뜨고 코 베인다&rdquo;는 속담을 들었어요. 정신
          차리지 않으면 코 베이기 십상이라는 말에, 코심이는 &ldquo;코 조심, 코 조심&rdquo;
          되뇌며 사기 수법을 하나씩 익히기로 했죠. 그 연습을 함께 하는 곳이 코심코심이에요.
        </p>
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
        <p className="text-sm font-medium text-muted">📋 진행 방식</p>
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
          알겠어요
        </Link>
      </div>
    </main>
  );
}
