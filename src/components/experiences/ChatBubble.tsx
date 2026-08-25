interface ChatBubbleProps {
  speaker: "caller" | "me";
  text: string;
}

export function ChatBubble({ speaker, text }: ChatBubbleProps) {
  const isMe = speaker === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isMe
            ? "bg-blue-500 text-white"
            : "border border-neutral-800 bg-[#141414] text-neutral-300"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
