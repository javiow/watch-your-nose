import { Mascot } from "@/components/ui/Mascot";
import { StartButton } from "@/components/ui/StartButton";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <Mascot className="h-36 w-auto sm:h-44" />

      <div className="space-y-4">
        <p className="text-sm font-medium text-accent">Watch Your Nose</p>
        <h1 className="text-5xl font-bold text-foreground sm:text-6xl">
          눈 뜨고 코 베인다
        </h1>
        <p className="text-base text-muted">
          나는 절대 안 속아? 그 자신감, 지금 바로 확인해보자.
        </p>
      </div>

      <div className="w-full space-y-3 rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <p className="text-sm font-medium text-muted">진행 방식</p>
        <ul className="space-y-2 text-sm leading-relaxed text-muted">
          <li>여러 단계로 진행됩니다.</li>
          <li>각 단계에서 선택하면 다음 단계로 넘어갑니다.</li>
          <li>
            정답과 오답은 그 자리에서 알려주지 않고, 결과는 마지막에 한 번에
            공개됩니다.
          </li>
        </ul>
      </div>

      <StartButton />
    </main>
  );
}
