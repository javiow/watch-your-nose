import { StartButton } from "@/components/ui/StartButton";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-blue-500"
      >
        <path
          d="M4 32C4 32 16 14 32 14C48 14 60 32 60 32C60 32 48 50 32 50C16 50 4 32 4 32Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="space-y-4">
        <p className="text-sm font-medium text-blue-500">Watch Your Nose</p>
        <h1 className="text-5xl font-bold text-white sm:text-6xl">
          눈 뜨고 코 베인다
        </h1>
        <p className="text-base text-neutral-300">
          나는 절대 안 속아? 그 자신감, 지금 바로 확인해보자.
        </p>
      </div>

      <div className="w-full space-y-3 rounded-lg border border-neutral-800 bg-[#141414] p-6 text-left">
        <p className="text-sm font-medium text-neutral-400">진행 방식</p>
        <ul className="space-y-2 text-sm leading-relaxed text-neutral-300">
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
