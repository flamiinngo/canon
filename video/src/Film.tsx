import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";

const { fontFamily: SANS } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

// ── Brand ────────────────────────────────────────────────────────────────
const C = {
  bg: "#07080a",
  surface: "#0f1115",
  fg: "#eef0f3",
  fg2: "#a3a9b4",
  fg3: "#6b717c",
  ember: "#ff6a3d",
  amber: "#ffb35c",
  violet: "#a98bff",
  cyan: "#52d6ff",
  ok: "#3ee39b",
  bad: "#ff5d6c",
};
const STOPS: [number, [number, number, number]][] = [
  [0, [255, 106, 61]],
  [0.33, [255, 179, 92]],
  [0.66, [169, 139, 255]],
  [1, [82, 214, 255]],
];
/** Colour at position t (0..1) along the brand spectrum. */
const sweep = (t: number) => {
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    const [a, ca] = STOPS[i - 1];
    if (t <= b) {
      const k = (t - a) / (b - a);
      return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k)).join(",")})`;
    }
  }
  return "rgb(82,214,255)";
};
const ART = {
  ember: "art/4127-flow-ember-base.jpg",
  relief: "art/4127-flow-ember-relief.jpg",
  motion: "art/4127-flow-ember-relief_motion.jpg",
  nocturne: "art/4127-flow-nocturne-recolor.jpg",
  pixel: "art/4127-flow-ember-pixel.jpg",
  moth: "art/913-rings-violet-base.jpg",
  fragments: "art/913-rings-violet-fragment.jpg",
  tidal: "art/2203-strata-tidal-base.jpg",
  quarry: "art/77-strata-quarry-relief.jpg",
};

// ── Timing ───────────────────────────────────────────────────────────────
const SCENES = [
  ["intro", 120],
  ["statement", 180],
  ["problem", 210],
  ["meet", 270],
  ["payment", 330],
  ["product", 300],
  ["security", 270],
  ["proof", 210],
  ["royalty", 210],
  ["end", 210],
] as const;
export const FILM_FRAMES = SCENES.reduce((a, [, d]) => a + d, 0);

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const fadeIn = (f: number, start: number, dur = 18) => interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const rise = (f: number, start: number, dist = 40, dur = 24) => interpolate(f, [start, start + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const sceneFade = (f: number, total: number) =>
  interpolate(f, [0, 14, total - 14, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ── Shared pieces ────────────────────────────────────────────────────────
const Backdrop: React.FC<{ glow?: string; at?: string }> = ({ glow = "rgba(255,106,61,0.16)", at = "50% 0%" }) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 90) * 4;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 55% at ${at}, ${glow}, transparent 70%)`, transform: `translateY(${drift}px)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(40% 40% at 85% 85%, rgba(169,139,255,0.08), transparent 70%)" }} />
    </AbsoluteFill>
  );
};

const Kicker: React.FC<{ children: React.ReactNode; delay?: number; color?: string }> = ({ children, delay = 0, color = C.fg3 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color, opacity: fadeIn(f, delay), transform: `translateY(${rise(f, delay, 16)}px)` }}>
      {children}
    </div>
  );
};

/** Word-by-word headline reveal. */
const Headline: React.FC<{ text: string; delay?: number; size?: number; gradient?: boolean; stagger?: number; align?: "left" | "center" }> = ({ text, delay = 0, size = 112, gradient = false, stagger = 4, align = "left" }) => {
  const f = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.045em", color: C.fg, textAlign: align, display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.26 }}>
      {words.map((w, i) => {
        const s = delay + i * stagger;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12 }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${interpolate(f, [s, s + 22], [size * 1.1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}px)`,
                ...(gradient ? { color: sweep(words.length <= 1 ? 0 : i / (words.length - 1)) } : {}),
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

const Mark: React.FC<{ size: number; progress: number }> = ({ size, progress }) => {
  const dash = 40;
  return (
    <svg viewBox="0 0 28 28" width={size} height={size}>
      <defs>
        <linearGradient id="mk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.ember} />
          <stop offset="0.5" stopColor={C.violet} />
          <stop offset="1" stopColor={C.cyan} />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" fill={C.surface} stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" opacity={Math.min(1, progress * 2)} />
      <path d="M14 7.5 V14 M14 14 L8.5 20 M14 14 L19.5 20" stroke="url(#mk)" strokeWidth="1.9" strokeLinecap="round" fill="none" strokeDasharray={dash} strokeDashoffset={dash * (1 - Math.min(1, progress * 1.4))} />
      <circle cx="14" cy="7.5" r={2.7 * Math.min(1, Math.max(0, progress * 3 - 1))} fill={C.ember} />
      <circle cx="8.5" cy="20.5" r={2.2 * Math.min(1, Math.max(0, progress * 3 - 1.4))} fill={C.violet} />
      <circle cx="19.5" cy="20.5" r={2.2 * Math.min(1, Math.max(0, progress * 3 - 1.8))} fill={C.cyan} />
    </svg>
  );
};

const Orb: React.FC<{ src: string; size: number; ring: string; glow?: number; pending?: boolean }> = ({ src, size, ring, glow = 0.35, pending }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <div style={{ position: "absolute", inset: -size * 0.6, borderRadius: "50%", background: `radial-gradient(closest-side, ${ring}${Math.round(glow * 255).toString(16).padStart(2, "0")}, transparent)` }} />
    <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: size, height: size, borderRadius: "50%", objectFit: "cover", opacity: pending ? 0.5 : 1 }} />
    <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: `2.5px ${pending ? "dashed" : "solid"} ${ring}` }} />
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; tone?: "light" | "ok" | "bad" | "ember"; style?: React.CSSProperties }> = ({ children, tone = "light", style }) => {
  const t = {
    light: { background: C.fg, color: C.bg },
    ok: { background: "rgba(62,227,155,0.12)", color: C.ok, border: "1px solid rgba(62,227,155,0.3)" },
    bad: { background: "rgba(255,93,108,0.12)", color: C.bad, border: "1px solid rgba(255,93,108,0.35)" },
    ember: { background: "rgba(255,106,61,0.12)", color: "#ffb08f", border: "1px solid rgba(255,106,61,0.45)" },
  }[tone];
  return <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, padding: "8px 18px", borderRadius: 999, whiteSpace: "nowrap", ...t, ...style }}>{children}</div>;
};

// ── Scenes ───────────────────────────────────────────────────────────────
const Intro: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(f, [6, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const scale = spring({ frame: f - 4, fps, config: { damping: 18, mass: 0.8 } });
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(255,106,61,0.12)" at="50% 50%" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
        <div style={{ transform: `scale(${0.85 + scale * 0.15})` }}>
          <Mark size={168} progress={p} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 104, letterSpacing: "-0.05em", color: C.fg, opacity: fadeIn(f, 40), transform: `translateY(${rise(f, 40, 24)}px)` }}>canon</div>
        <div style={{ marginTop: -10 }}>
          <Kicker delay={62}>The rights layer for creative IP</Kicker>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Statement: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 180px", gap: 30 }}>
        <Headline text="Creative work doesn't end with its creator." delay={6} size={104} />
        <Headline text="Neither should the money." delay={70} size={104} gradient />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Problem: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const cards = [
    { src: ART.fragments, label: "Built without asking", x: 0 },
    { src: ART.nocturne, label: "Impossible to clear", x: 1 },
    { src: ART.pixel, label: "Contributors forgotten", x: 2 },
  ];
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(255,93,108,0.10)" />
      <AbsoluteFill style={{ padding: "130px 180px", gap: 70 }}>
        <Kicker delay={4}>The problem</Kicker>
        <div style={{ display: "flex", gap: 56 }}>
          {cards.map((c, i) => {
            const s = 14 + i * 26;
            const strike = interpolate(f, [s + 40, s + 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
            return (
              <div key={c.label} style={{ flex: 1, opacity: fadeIn(f, s), transform: `translateY(${rise(f, s, 60, 30)}px)` }}>
                <Img src={staticFile(c.src)} style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 28, filter: `grayscale(${strike * 0.7}) brightness(${1 - strike * 0.35})` }} />
                <div style={{ position: "relative", display: "inline-block", marginTop: 34 }}>
                  <div style={{ fontFamily: SANS, fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em", color: C.fg }}>{c.label}</div>
                  <div style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${strike * 100}%`, background: C.bad, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Lineage geometry shared by "meet", "payment" and "royalty"
const N = {
  ember: { x: 960, y: 250, src: ART.ember, ring: C.ember, label: "Ember Field", acct: "ember.canonhq.testnet" },
  relief: { x: 640, y: 540, src: ART.relief, ring: C.violet, label: "Relief", acct: "ember-relief.canonhq.testnet" },
  nocturne: { x: 1280, y: 540, src: ART.nocturne, ring: C.violet, label: "Nocturne", acct: "ember-nocturne.canonhq.testnet" },
  motion: { x: 640, y: 830, src: ART.motion, ring: C.cyan, label: "Motion", acct: "ember-motion.canonhq.testnet" },
};
type NodeKey = keyof typeof N;
const R = 66;
const edgePath = (from: NodeKey, to: NodeKey) => {
  const a = N[from];
  const b = N[to];
  const y1 = a.y - R - 6;
  const y2 = b.y + R + 96;
  const my = (y1 + y2) / 2;
  return `M ${a.x} ${y1} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${y2}`;
};
const EDGES: [NodeKey, NodeKey][] = [
  ["relief", "ember"],
  ["nocturne", "ember"],
  ["motion", "relief"],
];

const Tree: React.FC<{ appear: (k: NodeKey) => number; edge: (i: number) => number; badges?: Partial<Record<NodeKey, { text: string; at: number; tone?: "light" | "ember" }>>; pulses?: { from: NodeKey; to: NodeKey; at: number; color: string }[]; showAcct?: boolean }> = ({ appear, edge, badges = {}, pulses = [], showAcct = true }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {EDGES.map(([a, b], i) => (
          <path key={i} d={edgePath(a, b)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={2.5} strokeDasharray={1200} strokeDashoffset={1200 * (1 - edge(i))} />
        ))}
        {pulses.map((p, i) => {
          const k = interpolate(f, [p.at, p.at + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
          if (k <= 0 || k >= 1) return null;
          return <path key={`p${i}`} d={edgePath(p.from, p.to)} fill="none" stroke={p.color} strokeWidth={6} strokeLinecap="round" strokeDasharray="70 1400" strokeDashoffset={-k * 1300} style={{ filter: `drop-shadow(0 0 12px ${p.color})` }} />;
        })}
      </svg>
      {(Object.keys(N) as NodeKey[]).map((k) => {
        const n = N[k];
        const a = appear(k);
        const b = badges[k];
        const bv = b ? interpolate(f, [b.at, b.at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) : 0;
        return (
          <div key={k} style={{ position: "absolute", left: n.x - R, top: n.y - R, opacity: a, transform: `scale(${0.7 + a * 0.3})` }}>
            <Orb src={n.src} size={R * 2} ring={n.ring} glow={0.3 + bv * 0.4} />
            <div style={{ position: "absolute", left: R, top: R * 2 + 16, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.fg, letterSpacing: "-0.02em" }}>{n.label}</div>
              {showAcct && <div style={{ fontFamily: MONO, fontSize: 18, color: C.fg3, marginTop: 4 }}>{n.acct}</div>}
            </div>
            {b && (
              <div style={{ position: "absolute", left: R * 2 + 22, top: R - 24, opacity: bv, transform: `translateX(${(1 - bv) * -14}px)` }}>
                <Pill tone={b.tone ?? "light"}>{b.text}</Pill>
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Meet: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const order: NodeKey[] = ["ember", "relief", "nocturne", "motion"];
  const keyAt = (k: NodeKey) => 30 + order.indexOf(k) * 22;
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(169,139,255,0.12)" at="50% 30%" />
      <div style={{ position: "absolute", left: 140, top: 120, width: 560, display: "flex", flexDirection: "column", gap: 26 }}>
        <Kicker delay={2} color={C.ember}>Meet Canon</Kicker>
        <Headline text="Every work is an NFT that owns its own wallet." delay={8} size={64} stagger={3} />
        <div style={{ fontFamily: SANS, fontSize: 28, lineHeight: 1.45, color: C.fg2, opacity: fadeIn(f, 120) }}>
          Derivatives join the family tree only when the original&apos;s owner approves them, on-chain.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, opacity: fadeIn(f, 160) }}>
          <Pill tone="ok">0 access keys</Pill>
          <Pill tone="ember">approval required</Pill>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, transform: "translateX(260px)" }}>
        <Tree appear={(k) => fadeIn(f, keyAt(k), 20)} edge={(i) => interpolate(f, [70 + i * 22, 110 + i * 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })} />
      </div>
    </AbsoluteFill>
  );
};

const Payment: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t0 = 60;
  const studioIn = fadeIn(f, 20);
  const rows: [string, string, string, number][] = [
    ["ember-motion vault", "0.900", C.cyan, t0 + 40],
    ["fay · score", "0.225", C.fg2, t0 + 52],
    ["ember-relief vault", "0.210", C.violet, t0 + 96],
    ["cy · materials", "0.090", C.fg2, t0 + 108],
    ["ember vault", "0.075", C.ember, t0 + 152],
  ];
  const total = interpolate(f, [t0 + 170, t0 + 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(255,106,61,0.14)" at="30% 100%" />
      <div style={{ position: "absolute", inset: 0, transform: "translateX(-220px)" }}>
        <Tree
          appear={() => 1}
          edge={() => 1}
          showAcct={false}
          pulses={[
            { from: "motion", to: "relief", at: t0 + 56, color: C.violet },
            { from: "relief", to: "ember", at: t0 + 112, color: C.ember },
          ]}
          badges={{ motion: { text: "+1.125 Ⓝ", at: t0 + 36 }, relief: { text: "+0.300 Ⓝ", at: t0 + 90 }, ember: { text: "+0.075 Ⓝ", at: t0 + 146 } }}
        />
        <div style={{ position: "absolute", left: 330, top: 975, opacity: studioIn, transform: `translateY(${(1 - studioIn) * 20}px)` }}>
          <Pill tone="ember">studio pays 1.5 Ⓝ</Pill>
        </div>
      </div>
      <div style={{ position: "absolute", right: 130, top: 150, width: 600 }}>
        <Kicker delay={4}>One licence</Kicker>
        <div style={{ marginTop: 22 }}>
          <Headline text="One payment. Every generation." delay={10} size={62} stagger={4} />
        </div>
        <div style={{ marginTop: 40, borderRadius: 24, background: "#0b0d10", padding: "26px 30px", boxShadow: "0 40px 100px -40px rgba(0,0,0,0.9)" }}>
          <div style={{ fontFamily: MONO, fontSize: 21, color: C.fg, opacity: fadeIn(f, t0) }}>
            buy_license(<span style={{ color: C.cyan }}>&quot;ember-motion&quot;</span>) · <span style={{ color: C.ember }}>1.5 Ⓝ</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 21, color: C.ok, marginTop: 12, opacity: fadeIn(f, t0 + 14) }}>✓ clearance 3/3 generations</div>
          {rows.map(([who, amt, col, at]) => (
            <div key={who} style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 21, marginTop: 12, opacity: fadeIn(f, at, 10), transform: `translateX(${(1 - fadeIn(f, at, 10)) * -12}px)` }}>
              <span style={{ color: C.fg2 }}>
                <span style={{ color: col }}>→</span> {who}
              </span>
              <span style={{ color: C.fg }}>+{amt}</span>
            </div>
          ))}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, opacity: total }}>
            <span style={{ color: C.ok }}>✓ Σ = price · 1 transaction</span>
            <span style={{ color: C.fg }}>1.500 Ⓝ</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Product: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const shots = [
    { src: "shots/work-top.png", cap: "Clearance across every ancestor" },
    { src: "shots/checkout.png", cap: "See exactly who gets paid, before you pay" },
    { src: "shots/collection.png", cap: "Licence NFTs that unlock source files" },
    { src: "shots/proof.png", cap: "Every claim is a transaction" },
  ];
  const per = d / shots.length;
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(82,214,255,0.10)" at="50% 100%" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
        <Kicker delay={2}>The product</Kicker>
      </div>
      {shots.map((s, i) => {
        const st = i * per;
        const local = f - st;
        const vis = interpolate(local, [0, 16, per - 12, per], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (vis <= 0) return null;
        const zoom = interpolate(local, [0, per], [1.0, 1.06]);
        const tilt = interpolate(local, [0, per], [8, 2]);
        return (
          <AbsoluteFill key={s.src} style={{ alignItems: "center", justifyContent: "center", opacity: vis, perspective: 2400 }}>
            <div style={{ transform: `rotateX(${tilt}deg) scale(${zoom * 0.74}) translateY(-30px)`, borderRadius: 26, overflow: "hidden", boxShadow: "0 80px 160px -40px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.08)" }}>
              <Img src={staticFile(s.src)} style={{ width: 1920, height: 1080, display: "block" }} />
            </div>
            <div style={{ position: "absolute", bottom: 90, fontFamily: SANS, fontWeight: 600, fontSize: 46, letterSpacing: "-0.03em", color: C.fg, transform: `translateY(${rise(local, 6, 20)}px)` }}>{s.cap}</div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

const Security: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const lines: [string, string][] = [
    ["seller withdraws after the sale", "ERR_NOT_OWNER"],
    ["sell mid-withdrawal", "ERR_TOKEN_LOCKED"],
    ["drain the vault while it's listed", "ERR_TOKEN_LISTED"],
    ["call a vault directly", "ERR_ONLY_REGISTRY"],
    ["license a non-commercial lineage", "ERR_NOT_CLEARED"],
  ];
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(255,93,108,0.10)" at="80% 20%" />
      <div style={{ position: "absolute", left: 150, top: 170, width: 700, display: "flex", flexDirection: "column", gap: 28 }}>
        <Kicker delay={2}>Control follows the token</Kicker>
        <Headline text="Sell the NFT. The money moves with it." delay={8} size={70} stagger={3} />
        <div style={{ marginTop: 30 }}>
          <Headline text="No master key. Not even ours." delay={150} size={56} stagger={3} gradient />
        </div>
      </div>
      <div style={{ position: "absolute", right: 140, top: 230, width: 860, borderRadius: 28, background: "#0b0d10", padding: "26px 10px 18px", boxShadow: "0 50px 120px -40px rgba(0,0,0,0.95)" }}>
        <div style={{ display: "flex", gap: 10, padding: "0 24px 14px" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 13, height: 13, borderRadius: 7, background: "rgba(255,255,255,0.12)" }} />
          ))}
          <span style={{ fontFamily: MONO, fontSize: 18, color: C.fg3, marginLeft: 12 }}>canonhq.testnet · live attempts</span>
        </div>
        {lines.map(([a, code], i) => {
          const at = 30 + i * 20;
          const v = fadeIn(f, at, 10);
          const stamp = spring({ frame: f - at - 8, fps: 30, config: { damping: 12, mass: 0.6 } });
          return (
            <div key={code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 24px", opacity: v }}>
              <span style={{ fontFamily: MONO, fontSize: 22, color: C.fg2 }}>
                <span style={{ color: C.fg3 }}>attempt:</span> {a}
              </span>
              <span style={{ transform: `scale(${0.6 + stamp * 0.4})`, opacity: stamp }}>
                <Pill tone="bad" style={{ fontSize: 19, padding: "6px 14px" }}>
                  {code}
                </Pill>
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Count: React.FC<{ to: number; at: number }> = ({ to, at }) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + 30], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return <>{Math.round(v)}</>;
};

const Proof: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const stats: [number, string, string][] = [
    [41, "contract tests passing", C.ok],
    [41, "real testnet transactions", C.cyan],
    [11, "attacks refused on-chain", C.bad],
    [0, "admin keys", C.amber],
  ];
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(62,227,155,0.10)" />
      <AbsoluteFill style={{ padding: "150px 160px", gap: 40 }}>
        <Kicker delay={2}>Don&apos;t trust. Verify.</Kicker>
        <Headline text="Every claim is a transaction you can open." delay={6} size={76} stagger={3} />
        <div style={{ display: "flex", gap: 60, marginTop: 60 }}>
          {stats.map(([n, l, c], i) => (
            <div key={l} style={{ flex: 1, opacity: fadeIn(f, 40 + i * 10), transform: `translateY(${rise(f, 40 + i * 10, 30)}px)` }}>
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 132, letterSpacing: "-0.06em", color: C.fg, lineHeight: 1 }}>
                <Count to={n} at={44 + i * 10} />
              </div>
              <div style={{ height: 3, width: 56, background: c, borderRadius: 2, margin: "26px 0 18px" }} />
              <div style={{ fontFamily: SANS, fontSize: 30, color: C.fg2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.fg3, marginTop: 30, opacity: fadeIn(f, 110) }}>NEP-171 · 177 · 178 · 181 · 199 · 591 · open source (MIT)</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Royalty: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: sceneFade(f, d) }}>
      <Backdrop glow="rgba(255,179,92,0.12)" at="50% 20%" />
      <div style={{ position: "absolute", left: 140, top: 150, width: 640, display: "flex", flexDirection: "column", gap: 26 }}>
        <Kicker delay={2} color={C.amber}>NEP-199 royalties</Kicker>
        <Headline text="Resold? Every ancestor still gets paid." delay={8} size={66} stagger={3} />
        <div style={{ fontFamily: SANS, fontSize: 28, lineHeight: 1.45, color: C.fg2, opacity: fadeIn(f, 90) }}>Any NEAR marketplace that sells a work pays the lineage automatically.</div>
      </div>
      <div style={{ position: "absolute", inset: 0, transform: "translateX(260px)" }}>
        <Tree
          appear={() => 1}
          edge={() => 1}
          showAcct={false}
          pulses={[{ from: "relief", to: "ember", at: 70, color: C.amber }]}
          badges={{ relief: { text: "sold · 1 Ⓝ", at: 40, tone: "ember" }, ember: { text: "+0.200 royalty", at: 96 } }}
        />
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [4, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <AbsoluteFill style={{ opacity: interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }) }}>
      <Backdrop glow="rgba(255,106,61,0.18)" at="50% 110%" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <Mark size={96} progress={p} />
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 80, letterSpacing: "-0.05em", color: C.fg, opacity: fadeIn(f, 20) }}>canon</div>
        </div>
        <Headline text="Creative IP that pays its whole family tree." delay={36} size={72} stagger={3} align="center" />
        <div style={{ display: "flex", gap: 18, marginTop: 20, opacity: fadeIn(f, 90) }}>
          <Pill>canon.bootstate.xyz</Pill>
          <Pill tone="ok">Live on NEAR</Pill>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.fg3, marginTop: 10, opacity: fadeIn(f, 110) }}>github.com/flamiinngo/canon</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const COMPONENTS: Record<(typeof SCENES)[number][0], React.FC<{ d: number }>> = {
  intro: Intro,
  statement: Statement,
  problem: Problem,
  meet: Meet,
  payment: Payment,
  product: Product,
  security: Security,
  proof: Proof,
  royalty: Royalty,
  end: End,
};

export const CanonFilm: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map(([name, dur]) => {
        const S = COMPONENTS[name];
        const el = (
          <Sequence key={name} from={from} durationInFrames={dur} name={name}>
            <S d={dur} />
          </Sequence>
        );
        from += dur;
        return el;
      })}
    </AbsoluteFill>
  );
};
