import { GlossaryTermText } from "@/components/ui/GlossaryTermText";

interface ChatBubbleProps {
  speaker: "caller" | "me";
  text: string;
}

export function ChatBubble({ speaker, text }: ChatBubbleProps) {
  const isMe = speaker === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isMe
            ? "bg-accent text-white"
            : "border border-border bg-surface text-muted"
        }`}
      >
        <GlossaryTermText text={text} />
      </div>
    </div>
  );
}
