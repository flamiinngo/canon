import { useId } from "react";
import type { Art } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Generative character art. Derivatives share their parent's species and
 * palette, so the family resemblance is visible at a glance.
 */
export function Character({ art, className, title }: { art: Art; className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const { species, hue, variant } = art;
  const shaded = variant === "shaded" || variant === "animated";
  const body = `oklch(0.74 0.15 ${hue})`;
  const bodyDark = `oklch(0.56 0.16 ${hue})`;
  const bodyLight = `oklch(0.88 0.08 ${hue})`;
  const belly = `oklch(0.96 0.03 ${hue})`;
  const ink = "oklch(0.2 0.02 270)";
  const fill = shaded ? `url(#${uid}-body)` : body;
  const bg = `oklch(0.94 0.04 ${hue})`;
  const bg2 = `oklch(0.88 0.07 ${(hue + 40) % 360})`;

  if (variant === "pixel") return <PixelCharacter hue={hue} className={className} title={title} />;

  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full", className)} role="img" aria-label={title ?? "Character artwork"}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
        <radialGradient id={`${uid}-body`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={bodyLight} />
          <stop offset="0.55" stopColor={body} />
          <stop offset="1" stopColor={bodyDark} />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="200" fill={`url(#${uid}-bg)`} />
      <circle cx="100" cy="92" r="70" fill={`url(#${uid}-glow)`} />
      {shaded && <ellipse cx="100" cy="182" rx="56" ry="8" fill="oklch(0.2 0.02 270 / 0.18)" />}

      <g className={variant === "animated" ? "anim-float" : undefined}>
        {/* Tail */}
        {species === "fox" && (
          <g className={variant === "animated" ? "anim-sway" : undefined}>
            <path d="M138 160 C 178 150, 186 108, 162 92 C 170 120, 152 140, 132 146 Z" fill={fill} />
            <path d="M162 92 C 176 104, 174 120, 168 128 C 164 112, 160 102, 162 92 Z" fill={belly} />
          </g>
        )}
        {species === "moth" && (
          <g opacity="0.95">
            <path d="M70 128 C 20 96, 18 160, 62 166 Z" fill={`oklch(0.66 0.16 ${hue})`} />
            <path d="M130 128 C 180 96, 182 160, 138 166 Z" fill={`oklch(0.66 0.16 ${hue})`} />
            <circle cx="44" cy="140" r="7" fill={belly} opacity="0.8" />
            <circle cx="156" cy="140" r="7" fill={belly} opacity="0.8" />
          </g>
        )}

        {/* Body */}
        <ellipse cx="100" cy="152" rx="46" ry="34" fill={fill} />
        <ellipse cx="100" cy="160" rx="26" ry="20" fill={belly} />

        {/* Ears / antennae */}
        {species === "fox" && (
          <>
            <path d="M58 70 L 66 22 L 96 56 Z" fill={fill} />
            <path d="M142 70 L 134 22 L 104 56 Z" fill={fill} />
            <path d="M66 62 L 70 36 L 86 56 Z" fill={belly} />
            <path d="M134 62 L 130 36 L 114 56 Z" fill={belly} />
          </>
        )}
        {(species === "bear" || species === "round") && (
          <>
            <circle cx={species === "bear" ? 62 : 70} cy={species === "bear" ? 54 : 50} r={species === "bear" ? 17 : 11} fill={fill} />
            <circle cx={species === "bear" ? 138 : 130} cy={species === "bear" ? 54 : 50} r={species === "bear" ? 17 : 11} fill={fill} />
            {species === "bear" && (
              <>
                <circle cx="62" cy="54" r="8" fill={belly} />
                <circle cx="138" cy="54" r="8" fill={belly} />
              </>
            )}
          </>
        )}
        {species === "moth" && (
          <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
            <path d="M88 52 C 80 30, 66 22, 58 24" />
            <path d="M112 52 C 120 30, 134 22, 142 24" />
            <circle cx="58" cy="24" r="4" fill={`oklch(0.66 0.16 ${hue})`} stroke="none" />
            <circle cx="142" cy="24" r="4" fill={`oklch(0.66 0.16 ${hue})`} stroke="none" />
          </g>
        )}

        {/* Head */}
        <circle cx="100" cy="92" r={species === "round" ? 50 : 44} fill={fill} />
        {species === "fox" && <path d="M70 104 C 82 128, 118 128, 130 104 C 118 112, 82 112, 70 104 Z" fill={belly} />}
        {species === "bear" && <ellipse cx="100" cy="108" rx="20" ry="14" fill={belly} />}
        {shaded && <ellipse cx="84" cy="70" rx="16" ry="9" fill="white" opacity="0.35" transform="rotate(-24 84 70)" />}

        {/* Face */}
        <g className={variant === "animated" ? "anim-blink" : undefined}>
          <ellipse cx="84" cy="92" rx="6" ry="8" fill={ink} />
          <ellipse cx="116" cy="92" rx="6" ry="8" fill={ink} />
          <circle cx="86" cy="89" r="2.2" fill="white" />
          <circle cx="118" cy="89" r="2.2" fill="white" />
        </g>
        <circle cx="74" cy="106" r="6" fill="oklch(0.75 0.13 15)" opacity="0.45" />
        <circle cx="126" cy="106" r="6" fill="oklch(0.75 0.13 15)" opacity="0.45" />
        <path d="M96 104 Q 100 108 104 104" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        {species === "bear" && <ellipse cx="100" cy="102" rx="5" ry="3.5" fill={ink} />}

        {/* Outfit */}
        {variant === "outfit" && (
          <g>
            <path d="M60 128 C 80 142, 120 142, 140 128 L 142 140 C 120 154, 80 154, 58 140 Z" fill={`oklch(0.58 0.2 ${(hue + 180) % 360})`} />
            <path d="M120 140 L 128 176 L 112 172 L 110 144 Z" fill={`oklch(0.52 0.2 ${(hue + 180) % 360})`} />
            <path d="M80 158 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="oklch(0.86 0.15 90)" />
          </g>
        )}
      </g>
    </svg>
  );
}

/** A pixel-art rendition built from a 16×16 grid. */
function PixelCharacter({ hue, className, title }: { hue: number; className?: string; title?: string }) {
  const map = [
    "................",
    "..X..........X..",
    "..XX........XX..",
    "..XOX......XOX..",
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    ".XXEEXXXXXXEEXX.",
    ".XXEEXXXXXXEEXX.",
    ".XCXXXXXXXXXXCX.",
    ".XXXOOOOOOOOXXX.",
    "..XXOOOMMOOOXX..",
    "...XXOOOOOOXX...",
    "...XXXXXXXXXXT..",
    "..XXXOOOOOOXXTT.",
    "..XXXOOOOOOXXXT.",
    "...XX......XX...",
  ];
  const colors: Record<string, string> = {
    X: `oklch(0.72 0.16 ${hue})`,
    O: `oklch(0.95 0.03 ${hue})`,
    E: "oklch(0.2 0.02 270)",
    C: "oklch(0.75 0.13 15)",
    M: "oklch(0.2 0.02 270)",
    T: `oklch(0.6 0.16 ${hue})`,
  };
  return (
    <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full", className)} shapeRendering="crispEdges" role="img" aria-label={title ?? "Pixel artwork"}>
      <rect width="16" height="16" fill={`oklch(0.93 0.04 ${hue})`} />
      {map.flatMap((row, y) =>
        row.split("").map((c, x) => (colors[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[c]} /> : null)),
      )}
    </svg>
  );
}
