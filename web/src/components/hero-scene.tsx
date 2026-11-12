"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderToUrl } from "@/lib/art";
import { computeCascade, formatNear } from "@/lib/canon";
import { getWork, vaultAccount } from "@/lib/data";
import { cn } from "@/lib/cn";

const CYCLE = 9000; // ms
const HOP = 950; // ms per edge
const GEN = ["#ff6a3d", "#a98bff", "#52d6ff", "#b6ff5c"];

type NodeDef = { id: string; x: number; y: number; gen: number; pending?: boolean };

// Normalised layout (desktop). Mobile compresses horizontally.
const NODES: NodeDef[] = [
  { id: "ember", x: 0.5, y: 0.17, gen: 0 },
  { id: "ember-relief", x: 0.3, y: 0.47, gen: 1 },
  { id: "ember-nocturne", x: 0.58, y: 0.47, gen: 1 },
  { id: "ember-pixel", x: 0.8, y: 0.47, gen: 1, pending: true },
  { id: "ember-motion", x: 0.3, y: 0.78, gen: 2 },
];
const STUDIO = { x: 0.08, y: 0.94 };

export function HeroScene({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const start = useRef(0);
  const cascade = useMemo(() => computeCascade("ember-motion", 150), []);
  const [tick, setTick] = useState(0);

  // Log clock
  useEffect(() => {
    start.current = performance.now();
    const id = setInterval(() => setTick(performance.now()), 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const c = canvas.current;
    const w = wrap.current;
    if (!c || !w) return;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const MONO = css.getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace";
    const SANS = css.getPropertyValue("--font-geist-sans").trim() || "ui-sans-serif, system-ui";
    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = w.clientWidth;
      H = w.clientHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(w);

    // Artwork images
    const imgs: Record<string, HTMLImageElement> = {};
    NODES.forEach((n) => {
      renderToUrl(getWork(n.id)!.genome, 256).then((u) => {
        const im = new Image();
        im.src = u;
        im.onload = () => (imgs[n.id] = im);
      });
    });

    // Ambient constellation
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const stars = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.4, p: rnd() * Math.PI * 2, s: 0.2 + rnd() * 0.6 }));
    const links: [number, number][] = [];
    stars.forEach((a, i) =>
      stars.forEach((b, j) => {
        if (j > i && Math.hypot(a.x - b.x, (a.y - b.y) * 0.6) < 0.11) links.push([i, j]);
      }),
    );

    const pos = (n: { x: number; y: number }) => {
      const mobile = W < 640;
      const x = mobile ? 0.08 + n.x * 0.84 : n.x;
      return { x: x * W, y: n.y * H };
    };
    const R = () => (W < 640 ? 20 : 30);

    const edgePts = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const my = (from.y + to.y) / 2;
      return [from, { x: from.x, y: my }, { x: to.x, y: my }, to] as const;
    };
    const bez = (p: readonly { x: number; y: number }[], t: number) => {
      const u = 1 - t;
      return {
        x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
        y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y,
      };
    };

    // The money path: studio → motion → relief → ember
    const path = ["studio", "ember-motion", "ember-relief", "ember"];
    const ambient = Array.from({ length: 26 }, (_, i) => ({ e: i % 4, t: Math.random(), v: 0.0018 + Math.random() * 0.0025 }));

    let raf = 0;
    const draw = (now: number) => {
      const t = (now - start.current) % CYCLE;
      ctx.clearRect(0, 0, W, H);

      // constellation
      ctx.lineWidth = 1;
      links.forEach(([i, j]) => {
        const a = stars[i];
        const b = stars[j];
        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.stroke();
      });
      stars.forEach((s) => {
        const tw = 0.25 + 0.25 * Math.sin(now * 0.001 * s.s + s.p);
        ctx.fillStyle = `rgba(255,255,255,${tw * 0.5})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const P: Record<string, { x: number; y: number }> = { studio: pos(STUDIO) };
      NODES.forEach((n) => (P[n.id] = pos(n)));
      const r = R();

      // edges
      const edges: [string, string, boolean][] = [
        ["ember-relief", "ember", false],
        ["ember-nocturne", "ember", false],
        ["ember-pixel", "ember", true],
        ["ember-motion", "ember-relief", false],
      ];
      edges.forEach(([child, parent, dashed]) => {
        const pts = edgePts({ x: P[child].x, y: P[child].y - r }, { x: P[parent].x, y: P[parent].y + r + 30 });
        ctx.setLineDash(dashed ? [4, 6] : []);
        ctx.strokeStyle = "rgba(255,255,255,0.13)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // studio link
      const sPts = edgePts({ x: P.studio.x, y: P.studio.y - 14 }, { x: P["ember-motion"].x - r - 4, y: P["ember-motion"].y + 8 });
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = "rgba(255,106,61,0.35)";
      ctx.beginPath();
      ctx.moveTo(sPts[0].x, sPts[0].y);
      ctx.bezierCurveTo(sPts[1].x, sPts[1].y, sPts[2].x, sPts[2].y, sPts[3].x, sPts[3].y);
      ctx.stroke();
      ctx.setLineDash([]);

      const hopPts = (i: number) => {
        const a = path[i];
        const b = path[i + 1];
        if (a === "studio") return sPts;
        return edgePts({ x: P[a].x, y: P[a].y - r }, { x: P[b].x, y: P[b].y + r + 30 });
      };

      // ambient money particles
      if (!reduce)
        ambient.forEach((p) => {
          p.t += p.v;
          if (p.t > 1) p.t = 0;
          const pts = hopPts(1 + (p.e % 2));
          const q = bez(pts, p.t);
          ctx.fillStyle = GEN[1 + (p.e % 2)] + "55";
          ctx.beginPath();
          ctx.arc(q.x, q.y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        });

      // licence packet
      const glow = (x: number, y: number, rad: number, col: string, a: number) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, "0"));
        g.addColorStop(1, col + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      };
      for (let i = 0; i < 3; i++) {
        const t0 = 300 + i * (HOP + 120);
        const k = (t - t0) / HOP;
        if (k < 0 || k > 1) continue;
        const ease = 1 - Math.pow(1 - k, 3);
        const pts = hopPts(i);
        const col = GEN[2 - i];
        for (let s = 0; s < 14; s++) {
          const q = bez(pts, Math.max(0, ease - s * 0.018));
          ctx.fillStyle = col;
          ctx.globalAlpha = (1 - s / 14) * 0.9;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 3.2 * (1 - s / 18), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        const head = bez(pts, ease);
        glow(head.x, head.y, 22, col, 0.55);
      }

      // studio chip
      const sx = P.studio.x;
      const sy = P.studio.y;
      ctx.font = `500 11px ${MONO}`;
      const label = "studio.near";
      const tw = ctx.measureText(label).width;
      roundRect(ctx, sx - tw / 2 - 12, sy - 13, tw + 24, 26, 13);
      ctx.fillStyle = "rgba(255,106,61,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,106,61,0.45)";
      ctx.stroke();
      ctx.fillStyle = "#ffb08f";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, sx, sy + 0.5);

      // nodes
      NODES.forEach((n) => {
        const { x, y } = P[n.id];
        const col = GEN[n.gen];
        const hitIdx = path.indexOf(n.id) - 1; // 0 motion, 1 relief, 2 ember
        const hitAt = hitIdx >= 0 ? 300 + hitIdx * (HOP + 120) + HOP : -1;
        const since = hitAt >= 0 ? t - hitAt : -1;
        const pulse = since >= 0 && since < 900 ? 1 - since / 900 : 0;
        glow(x, y, r * 2.6 + pulse * 30, col, 0.18 + pulse * 0.5);
        ctx.save();
        ctx.globalAlpha = n.pending ? 0.5 : 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "#111";
        ctx.fill();
        ctx.clip();
        const im = imgs[n.id];
        if (im) ctx.drawImage(im, x - r, y - r, r * 2, r * 2);
        ctx.restore();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = n.pending ? "rgba(255,255,255,0.25)" : col;
        ctx.setLineDash(n.pending ? [3, 4] : []);
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // labels
        const w = getWork(n.id)!;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = n.pending ? "rgba(238,240,243,0.45)" : "#eef0f3";
        ctx.font = `500 ${W < 640 ? 10.5 : 12.5}px ${SANS}`;
        ctx.fillText(w.title.includes("—") ? w.title.split("—")[1].trim() : w.title, x, y + r + 10);
        ctx.fillStyle = "rgba(163,169,180,0.7)";
        ctx.font = `400 ${W < 640 ? 9 : 10.5}px ${MONO}`;
        ctx.fillText(n.pending ? "pending review" : W < 640 ? w.owner : vaultAccount(n.id), x, y + r + 26);

        // amount badge
        if (hitAt >= 0 && since >= 0 && since < CYCLE - hitAt - 600) {
          const step = cascade[hitIdx];
          const txt = `+${formatNear(step.keptNear)} Ⓝ`;
          ctx.font = `600 ${W < 640 ? 10 : 11.5}px ${MONO}`;
          const bw = ctx.measureText(txt).width + 16;
          const appear = Math.min(1, since / 250);
          const fade = since > CYCLE - hitAt - 1400 ? Math.max(0, (CYCLE - hitAt - 600 - since) / 800) : 1;
          ctx.globalAlpha = appear * fade;
          const bx = x + r + 10;
          const by = y - 11 - (1 - appear) * 6;
          roundRect(ctx, bx, by, bw, 22, 11);
          ctx.fillStyle = "#eef0f3";
          ctx.fill();
          ctx.fillStyle = "#07080a";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, bx + 8, by + 11.5);
          ctx.globalAlpha = 1;
        }
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [cascade]);

  // Transaction log synced to the same clock
  const t = tick ? (tick - start.current) % CYCLE : 0;
  const [m, r, e] = cascade;
  const lines: { at: number; node: React.ReactNode }[] = [
    { at: 0, node: <><span className="text-fg">buy_license</span><span className="text-fg-3">(</span><span className="text-cyan">&quot;ember-motion&quot;</span><span className="text-fg-3">)</span> <span className="text-fg-3">·</span> <span className="text-ember">150.00 Ⓝ</span></> },
    { at: 350, node: <><span className="text-ok">✓</span> clearance <span className="text-fg-3">3/3 generations</span></> },
    { at: 300 + HOP, node: <><Arrow /> {vaultAccount("ember-motion")} <Amt v={m.payees[0].amountNear} /> <span className="text-fg-3">· fay.near</span> <Amt v={m.payees[1].amountNear} /></> },
    { at: 300 + (HOP + 120) + HOP, node: <><Arrow /> {vaultAccount("ember-relief")} <Amt v={r.payees[0].amountNear} /> <span className="text-fg-3">· cy.near</span> <Amt v={r.payees[1].amountNear} /></> },
    { at: 300 + 2 * (HOP + 120) + HOP, node: <><Arrow /> {vaultAccount("ember")} <Amt v={e.payees[0].amountNear} /></> },
    { at: 300 + 3 * (HOP + 120) + 300, node: <><span className="text-violet">◆</span> licence NFT <span className="text-fg">#0042</span> <span className="text-fg-3">→ studio.near</span></> },
    { at: 300 + 3 * (HOP + 120) + 700, node: <><span className="text-ok">✓</span> Σ <span className="text-fg">150.00 Ⓝ</span> <span className="text-fg-3">= price · 1 transaction</span></> },
  ];

  return (
    <div className={cn("relative", className)}>
      <div ref={wrap} className="relative h-[460px] w-full sm:h-[560px] lg:h-[620px]">
        <canvas ref={canvas} className="absolute inset-0" aria-label="Live diagram: one licence payment flowing up a family tree of NFT accounts" role="img" />
      </div>
      <div className="panel noise relative z-10 mx-auto -mt-4 w-full max-w-[520px] overflow-hidden bg-surface/80 backdrop-blur-xl sm:absolute sm:bottom-6 sm:right-6 sm:mt-0 sm:w-[440px] lg:bottom-10 lg:right-8">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[11px] text-fg-3">
            <span className="size-1.5 animate-pulse rounded-full bg-ok" /> tx · canon.near
          </span>
          <span className="font-mono text-[11px] text-fg-3">1 transaction</span>
        </div>
        <ol className="space-y-1.5 px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-fg-2 sm:text-[12px]">
          {lines.map((l, i) => (
            <li key={i} className={cn("truncate transition-all duration-300", t >= l.at ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0")}>
              {l.node}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Arrow() {
  return <span className="text-fg-3">→</span>;
}
function Amt({ v }: { v: number }) {
  return <span className="text-fg">+{formatNear(v)}</span>;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
