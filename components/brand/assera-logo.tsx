import Image from "next/image";

interface AsseraLogoProps {
  tone?: "espresso" | "ivory";
  showWord?: boolean;
  className?: string;
}

export function AsseraLogo({
  tone = "espresso",
  showWord = false,
  className = "",
}: AsseraLogoProps) {
  return (
    <a
      className={`assera-logo ${className}`.trim()}
      href="/"
      aria-label="ASSERA home"
    >
      <Image
        src={`/brand/assera-mark-${tone}.png`}
        alt=""
        width={54}
        height={54}
      />
      {showWord ? <span>ASSERA</span> : null}
    </a>
  );
}
