/**
 * App icons rendered as SF-Symbol-style SVG glyphs inside an Apple "squircle"
 * container. Each glyph is hand-drawn to telegraph the product's purpose
 * (Familiarity §16#4) — a battery for ChargePilot, a waveform for MinuteFlow,
 * etc. — instead of a meaningless letter.
 *
 * The container applies the brand gradient, a soft top highlight (light
 * catching a physical material, §12), and a deeper bottom edge, so the icon
 * reads as a real object rather than a flat colored square.
 */

export type IconKey =
  | "battery"
  | "waveform"
  | "terminal"
  | "play"
  | "remote"
  | "sync"
  | "code";

const GLYPHS: Record<IconKey, React.ReactNode> = {
  // ChargePilot — a battery bolt
  battery: (
    <>
      <rect x="12" y="16" width="40" height="32" rx="8" fill="none" stroke="white" strokeWidth="3.5" />
      <rect x="54" y="26" width="5" height="12" rx="2.5" fill="white" />
      <path d="M30 22 L24 34 H30 L28 42 L36 30 H30 L32 22 Z" fill="white" />
    </>
  ),
  // MinuteFlow — recording / waveform
  waveform: (
    <g fill="white">
      <rect x="18" y="28" width="4" height="16" rx="2" />
      <rect x="26" y="20" width="4" height="32" rx="2" />
      <rect x="34" y="24" width="4" height="24" rx="2" />
      <rect x="42" y="18" width="4" height="36" rx="2" />
      <rect x="50" y="30" width="4" height="12" rx="2" />
    </g>
  ),
  // ServerHub — a server / terminal prompt
  terminal: (
    <>
      <rect x="14" y="18" width="40" height="28" rx="6" fill="none" stroke="white" strokeWidth="3.5" />
      <path d="M22 30 L27 35 L22 40" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="31" y="38" width="14" height="3" rx="1.5" fill="white" />
    </>
  ),
  // Tellyra — play in screen (IPTV)
  play: (
    <>
      <rect x="14" y="18" width="40" height="28" rx="6" fill="none" stroke="white" strokeWidth="3.5" />
      <path d="M34 28 L42 33 L34 38 Z" fill="white" />
    </>
  ),
  // Tivon — remote / directional pad
  remote: (
    <>
      <rect x="22" y="14" width="20" height="36" rx="8" fill="none" stroke="white" strokeWidth="3.5" />
      <circle cx="32" cy="22" r="2.5" fill="white" />
      <path d="M32 30 L28 34 M32 30 L36 34 M32 30 L32 26 M32 38 L28 34 M32 38 L36 34"
        fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="42" r="2.5" fill="white" />
    </>
  ),
  // TuneSync — circular sync arrows
  sync: (
    <>
      <path d="M40 20 A14 14 0 1 0 46 42"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40 16 L40 23 L47 23"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 48 A14 14 0 1 0 22 26"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M28 52 L28 45 L21 45"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // TailTalk — code brackets
  code: (
    <>
      <path d="M26 22 L16 34 L26 46"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 22 L52 34 L42 46"
        fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="31" y="20" width="4" height="28" rx="2" fill="white" transform="rotate(12 33 34)" />
    </>
  ),
};

export function AppIcon({
  icon,
  gradient,
  size = 56,
}: {
  icon: IconKey;
  gradient: { from: string; to: string };
  size?: number;
}) {
  const id = `g-${icon}-${gradient.from.replace("#", "")}-${gradient.to.replace("#", "")}`;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.235, // Apple squircle ratio (~23.5%)
        backgroundImage: `linear-gradient(145deg, ${gradient.from}, ${gradient.to})`,
        boxShadow:
          "0 8px 20px -6px rgba(0,0,0,0.45), inset 0 1.5px 1px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.18)",
      }}
      aria-hidden
    >
      {/* top specular highlight — light catching a physical surface (§12) */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: size * 0.235,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
      <svg
        viewBox="0 0 64 64"
        width={size * 0.62}
        height={size * 0.62}
        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" }}
      >
        {GLYPHS[icon]}
      </svg>
    </span>
  );
}
