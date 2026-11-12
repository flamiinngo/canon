"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WORKS, rootOf } from "@/lib/data";
import { computeCascade, formatNear } from "@/lib/canon";
import type { Work } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Character } from "./character";

const GEN_COLORS = ["var(--gen-0)", "var(--gen-1)", "var(--gen-2)", "var(--gen-3)"];

interface LaidOutNode {
  work: Work;
  depth: number;
  x: number;
  y: number;
}

function layoutTree(rootId: string, includePending: boolean) {
  const visible = (w: Work) => includePending || w.status !== "pending";
  const kids = (id: string) => WORKS.filter((w) => w.parentId === id && visible(w));
  const order: { work: Work; depth: number; xi: number }[] = [];
  let leaf = 0;
  const walk = (w: Work, depth: number): number => {
    const ch = kids(w.id);
    if (!ch.length) {
      const xi = leaf++;
      order.push({ work: w, depth, xi });
      return xi;
    }
    const xs = ch.map((c) => walk(c, depth + 1));
    const xi = (xs[0] + xs[xs.length - 1]) / 2;
    order.push({ work: w, depth, xi });
    return xi;
  };
  const root = WORKS.find((w) => w.id === rootId)!;
  walk(root, 0);
  const maxDepth = Math.max(...order.map((o) => o.depth));
  return { order, leaves: Math.max(1, leaf), maxDepth };
}

export interface PayoutRun {
  workId: string;
  priceNear: number;
  key: number;
}

export function LineageGraph({
  focusId,
  payout,
  autoplay = false,
  includePending = true,
  linkNodes = true,
  className,
  onPayoutDone,
}: {
  focusId: string;
  payout?: PayoutRun | null;
  autoplay?: boolean;
  includePending?: boolean;
  linkNodes?: boolean;
  className?: string;
  onPayoutDone?: () => void;
}) {
  const root = rootOf(focusId);
  const { order, leaves, maxDepth } = useMemo(() => layoutTree(root.id, includePending), [root.id, includePending]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const compact = width > 0 && width < 520;
  const rowH = compact ? 132 : 150;
  const avatar = compact ? 52 : 64;
  const padX = compact ? 8 : 24;
  const top = avatar / 2 + 34;
  const height = top + maxDepth * rowH + avatar / 2 + 48;

  const nodes: LaidOutNode[] = order.map((o) => ({
    work: o.work,
    depth: o.depth,
    x: padX + ((o.xi + 0.5) * (Math.max(width, 1) - padX * 2)) / leaves,
    y: top + o.depth * rowH,
  }));
  const byId = Object.fromEntries(nodes.map((n) => [n.work.id, n]));
  const edges = nodes.filter((n) => n.work.parentId && byId[n.work.parentId]).map((n) => ({ child: n, parent: byId[n.work.parentId!] }));

  const edgePath = (from: LaidOutNode, to: LaidOutNode) => {
    // from child (bottom) up to parent (top)
    const y1 = from.y - avatar / 2;
    const y2 = to.y + avatar / 2 + 50;
    const my = (y1 + y2) / 2;
    return `M ${from.x} ${y1} C ${from.x} ${my}, ${to.x} ${my}, ${to.x} ${y2}`;
  };

  // ── Payout choreography ───────────────────────────────────────
  const [autoKey, setAutoKey] = useState(0);
  const autoRun: PayoutRun | null = autoplay ? { workId: focusId, priceNear: 150, key: autoKey } : null;
  const run = payout ?? autoRun;
  const cascade = useMemo(() => (run ? computeCascade(run.workId, run.priceNear) : []), [run?.workId, run?.priceNear]); // eslint-disable-line react-hooks/exhaustive-deps
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [activeEdge, setActiveEdge] = useState(-1);
  const [burst, setBurst] = useState<string | null>(null);
  const STEP = 1100;

  const reset = useCallback(() => {
    setCredits({});
    setActiveEdge(-1);
    setBurst(null);
  }, []);

  useEffect(() => {
    if (!run || !cascade.length || width === 0) return;
    reset();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduce ? 0 : STEP;
    timers.push(setTimeout(() => setBurst(cascade[0].work.id), 150));
    cascade.forEach((s, i) => {
      timers.push(
        setTimeout(() => {
          if (i > 0) setActiveEdge(i - 1);
          timers.push(setTimeout(() => setCredits((c) => ({ ...c, [s.work.id]: s.keptNear })), i === 0 ? 350 : step * 0.8));
        }, 300 + i * step),
      );
    });
    const total = 300 + cascade.length * step + 400;
    timers.push(setTimeout(() => onPayoutDone?.(), total));
    if (autoplay && !payout) timers.push(setTimeout(() => setAutoKey((k) => k + 1), total + 2600));
    return () => timers.forEach(clearTimeout);
  }, [run?.key, run?.workId, cascade, width]); // eslint-disable-line react-hooks/exhaustive-deps

  const flowEdges = cascade.slice(1).map((s, i) => ({ from: byId[cascade[i].work.id], to: byId[s.work.id] }));

  return (
    <div ref={wrapRef} className={cn("relative w-full select-none", className)} style={{ height }}>
      {width > 0 && (
        <>
          <svg className="absolute inset-0 overflow-visible" width={width} height={height} aria-hidden>
            {edges.map(({ child, parent }) => {
              const s = child.work.status;
              return (
                <path
                  key={child.work.id}
                  d={edgePath(child, parent)}
                  fill="none"
                  stroke={s === "revoked" ? "var(--bad)" : "var(--line-strong)"}
                  strokeWidth={1.5}
                  strokeDasharray={s === "approved" ? undefined : "4 5"}
                  strokeLinecap="round"
                  opacity={s === "revoked" ? 0.6 : 1}
                />
              );
            })}
            {flowEdges.map((e, i) =>
              e.from && e.to && i <= activeEdge ? (
                <FlowEdge key={`${run?.key}-${i}`} d={edgePath(e.from, e.to)} color={GEN_COLORS[(i + 1) % 4]} duration={STEP * 0.8} />
              ) : null,
            )}
          </svg>

          {nodes.map((n) => (
            <Node
              key={n.work.id}
              node={n}
              avatar={avatar}
              compact={compact}
              focused={n.work.id === focusId}
              credit={credits[n.work.id]}
              burst={burst === n.work.id}
              priceNear={run?.priceNear}
              link={linkNodes}
            />
          ))}
        </>
      )}
    </div>
  );
}

function FlowEdge({ d, color, duration }: { d: string; color: string; duration: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const haloRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const p = path.getPointAtLength(ease(t) * len);
      for (const el of [dotRef.current, haloRef.current]) {
        el?.setAttribute("cx", String(p.x));
        el?.setAttribute("cy", String(p.y));
      }
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        dotRef.current?.setAttribute("opacity", "0");
        haloRef.current?.setAttribute("opacity", "0");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <g>
      <motion.path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: duration / 1000, ease: [0.33, 1, 0.68, 1] }}
      />
      <circle ref={haloRef} r={10} fill={color} opacity={0.25} />
      <circle ref={dotRef} r={4.5} fill={color} />
    </g>
  );
}

function Node({
  node,
  avatar,
  compact,
  focused,
  credit,
  burst,
  priceNear,
  link,
}: {
  node: LaidOutNode;
  avatar: number;
  compact: boolean;
  focused: boolean;
  credit?: number;
  burst: boolean;
  priceNear?: number;
  link: boolean;
}) {
  const { work, depth } = node;
  const color = GEN_COLORS[depth % 4];
  const dim = work.status === "revoked" || work.status === "pending";
  const inner = (
    <>
      <div className="relative" style={{ width: avatar, height: avatar }}>
        {burst && <span className="anim-ping absolute inset-0 rounded-full" style={{ background: "var(--accent)" }} />}
        <div
          className={cn(
            "relative size-full overflow-hidden rounded-full bg-surface shadow-card transition-transform duration-300 group-hover:scale-105",
            dim && "opacity-55 grayscale-[0.4]",
          )}
          style={{ boxShadow: `0 0 0 ${focused ? 3 : 2}px var(--paper), 0 0 0 ${focused ? 5 : 3.5}px ${focused ? "var(--accent)" : color}` }}
        >
          <Character art={work.art} title={work.title} />
        </div>
        <AnimatePresence>
          {credit !== undefined && (
            <motion.span
              initial={{ opacity: 0, x: -6, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
              className="num absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-paper shadow-float"
            >
              +{formatNear(credit)} Ⓝ
            </motion.span>
          )}
        </AnimatePresence>
        {burst && priceNear !== undefined && credit === undefined && (
          <span className="num absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap text-[10px] text-accent">
            {formatNear(priceNear, 0)} Ⓝ in
          </span>
        )}
      </div>
      <div className="mt-2.5 text-center" style={{ width: compact ? 96 : 132 }}>
        <p className={cn("truncate font-medium leading-tight text-ink", compact ? "text-[11px]" : "text-[13px]")}>
          {work.title.replace(/^.*— /, "")}
        </p>
        <p className="truncate font-mono text-[10px] text-ink-3">
          {work.status === "approved" ? work.owner : work.status === "pending" ? "pending" : work.status}
        </p>
      </div>
    </>
  );

  const cls = "group absolute flex -translate-x-1/2 flex-col items-center";
  const style = { left: node.x, top: node.y - avatar / 2 };
  return link ? (
    <Link href={`/works/${work.id}`} className={cls} style={style} aria-label={`${work.title} by ${work.owner}`}>
      {inner}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {inner}
    </div>
  );
}
