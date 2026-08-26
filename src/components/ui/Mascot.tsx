import Image from "next/image";

interface MascotProps {
  className?: string;
}

export function Mascot({ className }: MascotProps) {
  return (
    <Image
      src="/mascot.png"
      alt=""
      aria-hidden="true"
      width={480}
      height={444}
      priority
      className={`object-contain ${className ?? ""}`}
    />
  );
}
