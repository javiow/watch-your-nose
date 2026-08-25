"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DialogueChoice,
  DialogueNode,
  ModuleResult,
  VoicePhishingScenario,
} from "@/types/experience";
import { computeGrade } from "@/lib/scoring";
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

function buildExplanation(isNormalCase: boolean, isCorrect: boolean): string {
  if (isNormalCase) {
    return isCorrect
      ? "개인정보를 요구하지 않는 정상적인 확인 전화였고, 무리 없이 응대한 것이 적절합니다."
      : "정상적인 절차였음에도 무조건 전화를 끊었습니다. 모든 전화를 의심하기보다 요청 내용을 확인하는 습관이 중요합니다.";
  }
  return isCorrect
    ? "개인정보나 금전을 요구하는 의심스러운 요청에 응하지 않고 전화를 끊은 것은 올바른 대응입니다."
    : "실제로는 사기 정황이 있는 전화였는데 요청에 응했습니다. 낯선 연락처의 개인정보·금전 요청에는 응하지 않아야 합니다.";
}

interface VoicePhishingExperienceProps {
  content: VoicePhishingScenario;
  onComplete: (result: ModuleResult) => void;
}

export function VoicePhishingExperience({
  content,
  onComplete,
}: VoicePhishingExperienceProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState(content.startNodeId);
  const [typing, setTyping] = useState(false);
  const [choicesReady, setChoicesReady] = useState(false);
  const timers = useRef<number[]>([]);

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
    revealNode(content.startNodeId);
    return () => {
      timers.current.forEach((timerId) => window.clearTimeout(timerId));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentNode = findNode(content.nodes, currentNodeId);

  const finishScenario = (choice: DialogueChoice) => {
    const refused = choice.id.startsWith("refuse");
    const isCorrect = content.isNormalCase ? !refused : refused;
    const score = isCorrect ? 100 : 0;
    const mistakeTag = isCorrect
      ? undefined
      : content.isNormalCase
        ? "blind-refusal"
        : "fell-for-scam";

    addTimer(() => {
      onComplete({
        typeId: "voice-phishing",
        contentId: content.id,
        score,
        grade: computeGrade(score),
        userChoice: choice.text,
        correctChoice: content.isNormalCase
          ? "정상적으로 응대를 이어간다"
          : "의심스러운 요청을 거절하고 전화를 끊는다",
        isCorrect,
        explanation: buildExplanation(content.isNormalCase, isCorrect),
        mistakeTag,
      });
    }, 600);
  };

  const handleSelectChoice = (choiceId: string) => {
    if (!currentNode) return;
    const choice = currentNode.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    setHistory((prev) => [
      ...prev,
      { id: `${currentNode.id}-me`, speaker: "me", text: choice.text },
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
    </div>
  );
}
