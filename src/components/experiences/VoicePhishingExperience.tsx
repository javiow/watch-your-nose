"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ChoiceRisk,
  DialogueChoice,
  DialogueNode,
  ModuleResult,
  VoicePhishingScenario,
} from "@/types/experience";
import { computeGrade, computeVoicePhishingScore } from "@/lib/scoring";
import { NextStepButton } from "@/components/ui/NextStepButton";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { EXPERIENCE_FORMAT } from "@/data/experience-format";
import { ChatBubble } from "./ChatBubble";
import { ChatChoiceButtons } from "./ChatChoiceButtons";
import { TypingIndicator } from "./TypingIndicator";

interface HistoryEntry {
  id: string;
  speaker: "caller" | "me";
  text: string;
}

function findNode(
  nodes: DialogueNode[],
  nodeId: string
): DialogueNode | undefined {
  return nodes.find((node) => node.id === nodeId);
}

function computeTypingDelay(text: string): number {
  return Math.min(500 + text.length * 25, 2200);
}

function buildExplanation(
  isNormalCase: boolean,
  isCorrect: boolean,
  cautionCount: number
): string {
  if (isNormalCase) {
    if (!isCorrect) {
      return "정상적인 절차였음에도 근거 없이 전화를 끊거나 무시했습니다. 낯선 연락이라고 무조건 의심하기보다, **요청 내용을 확인하고 필요하면 공식 채널로 재확인하는 습관**이 중요합니다.";
    }
    return cautionCount > 0
      ? "일부 과도하게 경계한 순간이 있었지만, 결국 개인정보를 요구하지 않는 정상 절차임을 알아채고 적절히 협조했습니다."
      : "개인정보를 요구하지 않는 정상적인 확인 전화였고, 처음부터 끝까지 적절하게 응대했습니다.";
  }
  if (!isCorrect) {
    return "실제로는 사기 정황이 있는 전화였는데 요청에 응했습니다. **낯선 연락처의 개인정보·금전 요청에는 응하지 않아야 합니다.**";
  }
  return cautionCount > 0
    ? `대화 중 ${cautionCount}번 정도 위험 신호를 가볍게 넘길 뻔했지만, 끝까지 개인정보·금전 요청에 응하지 않고 전화를 끊은 것은 올바른 대응입니다.`
    : "개인정보나 금전을 요구하는 의심스러운 요청에 응하지 않고 전화를 끊은 것은 올바른 대응입니다.";
}

interface VoicePhishingExperienceProps {
  content: VoicePhishingScenario;
  onComplete: (result: ModuleResult) => void;
}

export function VoicePhishingExperience({
  content,
  onComplete,
}: VoicePhishingExperienceProps) {
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState(content.startNodeId);
  const [typing, setTyping] = useState(false);
  const [choicesReady, setChoicesReady] = useState(false);
  const [pendingResult, setPendingResult] = useState<ModuleResult | null>(null);
  const timers = useRef<number[]>([]);
  const pathRisks = useRef<ChoiceRisk[]>([]);
  const nextStepSubmittedRef = useRef(false);

  const addTimer = (fn: () => void, delay: number) => {
    const timerId = window.setTimeout(fn, delay);
    timers.current.push(timerId);
  };

  const revealNode = (nodeId: string) => {
    const node = findNode(content.nodes, nodeId);
    if (!node) return;
    setTyping(true);
    setChoicesReady(false);
    addTimer(() => {
      setHistory((prev) => [
        ...prev,
        { id: `${node.id}-caller`, speaker: "caller", text: node.line },
      ]);
      setTyping(false);
      setChoicesReady(true);
    }, computeTypingDelay(node.line));
  };

  useEffect(() => {
    if (!started) return;
    revealNode(content.startNodeId);
    return () => {
      timers.current.forEach((timerId) => window.clearTimeout(timerId));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const currentNode = findNode(content.nodes, currentNodeId);

  const finishScenario = (choice: DialogueChoice) => {
    const { score, isCorrect } = computeVoicePhishingScore(pathRisks.current);
    const cautionCount = pathRisks.current.filter(
      (risk) => risk === "caution"
    ).length;
    const mistakeTag = isCorrect
      ? undefined
      : content.isNormalCase
        ? "blind-refusal"
        : "fell-for-scam";

    addTimer(() => {
      setPendingResult({
        typeId: "voice-phishing",
        contentId: content.id,
        score,
        grade: computeGrade(score),
        userChoice: choice.text,
        correctChoice: content.isNormalCase
          ? "정상적으로 응대를 이어간다"
          : "의심스러운 요청을 거절하고 전화를 끊는다",
        isCorrect,
        explanation: buildExplanation(
          content.isNormalCase,
          isCorrect,
          cautionCount
        ),
        mistakeTag,
      });
    }, 600);
  };

  const handleNextStep = () => {
    if (!pendingResult || nextStepSubmittedRef.current) return;
    nextStepSubmittedRef.current = true;
    onComplete(pendingResult);
  };

  const handleSelectChoice = (choiceId: string) => {
    if (!currentNode) return;
    const choice = currentNode.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    pathRisks.current.push(choice.risk);
    setHistory((prev) => [
      ...prev,
      {
        id: `${currentNode.id}-me`,
        speaker: "me",
        text: choice.spokenText ?? choice.text,
      },
    ]);
    setChoicesReady(false);

    const nextNode = choice.next
      ? findNode(content.nodes, choice.next)
      : undefined;

    if (choice.next && nextNode) {
      setCurrentNodeId(nextNode.id);
      revealNode(nextNode.id);
      return;
    }

    finishScenario(choice);
  };

  if (!started) {
    return (
      <div className="space-y-6">
        <FormatBadge format={EXPERIENCE_FORMAT["voice-phishing"]} />
        <p className="text-sm leading-relaxed text-muted">
          {EXPERIENCE_FORMAT["voice-phishing"].hint}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="min-h-11 rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            통화 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {history.map((entry) => (
          <ChatBubble key={entry.id} speaker={entry.speaker} text={entry.text} />
        ))}
        {typing && <TypingIndicator />}
      </div>

      {choicesReady && currentNode && (
        <ChatChoiceButtons
          key={currentNode.id}
          choices={currentNode.choices}
          onSelect={handleSelectChoice}
        />
      )}

      {pendingResult && (
        <NextStepButton onClick={handleNextStep} message="통화를 마쳤습니다." />
      )}
    </div>
  );
}
