"use client";

import { useState } from "react";
import type {
  DialogueChoice,
  DialogueNode,
  ModuleResult,
  VoicePhishingScenario,
} from "@/types/experience";
import { computeGrade } from "@/lib/scoring";

function isRefusalChoice(choice: DialogueChoice): boolean {
  return choice.id.startsWith("refuse");
}

function findNode(
  nodes: DialogueNode[],
  nodeId: string
): DialogueNode | undefined {
  return nodes.find((node) => node.id === nodeId);
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
  const [currentNodeId, setCurrentNodeId] = useState(content.startNodeId);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(
    null
  );

  const currentNode = findNode(content.nodes, currentNodeId);

  if (!currentNode) {
    return null;
  }

  const handleNext = () => {
    const choice = currentNode.choices.find(
      (c) => c.id === selectedChoiceId
    );
    if (!choice) return;

    const nextNode = choice.next
      ? findNode(content.nodes, choice.next)
      : undefined;

    if (choice.next && nextNode) {
      setCurrentNodeId(nextNode.id);
      setSelectedChoiceId(null);
      return;
    }

    const refused = isRefusalChoice(choice);
    const isCorrect = content.isNormalCase ? !refused : refused;
    const score = isCorrect ? 100 : 0;

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
      mistakeTag: isCorrect ? undefined : "blind-refusal",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border border-neutral-800 bg-[#141414] p-6">
        <p className="text-sm font-medium text-neutral-400">
          {currentNode.speaker}
        </p>
        <p className="text-sm leading-relaxed text-neutral-300">
          {currentNode.line}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {currentNode.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => setSelectedChoiceId(choice.id)}
            className={`min-h-11 rounded-lg border p-4 text-left text-sm text-neutral-300 transition-colors ${
              selectedChoiceId === choice.id
                ? "border-blue-500 bg-blue-500/10"
                : "border-neutral-800 bg-[#141414]"
            }`}
          >
            {choice.text}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedChoiceId}
          className="min-h-11 rounded-lg bg-blue-500 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          다음
        </button>
      </div>
    </div>
  );
}
