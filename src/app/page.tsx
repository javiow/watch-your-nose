import { LandingHero } from "@/components/ui/LandingHero";

export default function Home() {
  return (
    <main>
      <LandingHero />

      <section
        id="how-it-works"
        className="mx-auto max-w-3xl scroll-mt-8 px-4 py-16"
      >
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
      </section>
    </main>
  );
}
