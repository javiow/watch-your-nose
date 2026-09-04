import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-16">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-accent">Watch Your Nose</p>
        <h1 className="text-3xl font-bold text-foreground">
          시작하기 전에 잠깐 알려드릴게요
        </h1>
        <p className="text-base leading-relaxed text-muted">
          코심코심은 실제와 같은 금융 사기 상황을 사전 안내 없이 체험하며,
          내가 정말 안 속을 자신이 있는지 점검하는 서비스예요.
        </p>
        <p className="text-base leading-relaxed text-muted">
          전화, 문자, 실제 계약이나 매물 확인까지 — 일상 곳곳에서 마주칠 수
          있는 다양한 사기 상황을 여러 형태로 만나게 됩니다.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <p className="text-sm font-medium text-muted">진행 방식</p>
        <ul className="space-y-2 text-sm leading-relaxed text-muted">
          <li>여러 단계로 진행됩니다.</li>
          <li>
            각 단계를 마치면 화면에 나타나는 &ldquo;다음으로 넘어가기&rdquo;
            버튼을 눌러야 다음 단계로 이동합니다.
          </li>
          <li>선택 직후에는 정답과 오답을 알려주지 않습니다.</li>
          <li>
            모든 단계를 마치면 결과 페이지에서 종합 점수, 문항별 리뷰(몇
            번이 어떤 콘텐츠였는지 포함), 오답에 대한 대응 방안을 한 번에
            확인할 수 있습니다.
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
