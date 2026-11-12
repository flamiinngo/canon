"use client";

import { useEffect, useRef, useState } from "react";
import { PALETTES, mulberry32, placeholderCss, renderToUrl, type Genome } from "@/lib/art";
import { cn } from "@/lib/cn";

/**
 * Renders a work's generative artwork. The static image is drawn once per
 * genome and cached. With `live`, motion works animate in place.
 */
export function Artwork({ genome, className, alt, live = false, size = 720 }: { genome: Genome; className?: string; alt?: string; live?: boolean; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    renderToUrl(genome, size).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [genome, size]);

  const animate = live && genome.transforms.includes("motion");

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: placeholderCss(genome) }} role="img" aria-label={alt ?? "Artwork"}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" draggable={false} onLoad={(e) => (e.currentTarget.style.opacity = "1")} className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700" />
      )}
      {animate && <MotionLayer genome={genome} />}
    </div>
  );
}

function MotionLayer({ genome }: { genome: Genome }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const pal = PALETTES[genome.palette];
    const rand = mulberry32(genome.seed + 5);
    const pts = Array.from({ length: 260 }, () => ({ x: rand() * W, y: rand() * H, c: pal[1 + Math.floor(rand() * (pal.length - 1))], life: rand() * 200 }));
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.004;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const p of pts) {
        const a = Math.sin(p.x * 0.012 + t * 3) * 1.6 + Math.cos(p.y * 0.01 - t * 2) * 1.6;
        const nx = p.x + Math.cos(a) * 1.4;
        const ny = p.y + Math.sin(a) * 1.4;
        ctx.strokeStyle = p.c;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        if (--p.life < 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = rand() * W;
          p.y = rand() * H;
          p.life = 120 + rand() * 160;
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [genome]);
  return <canvas ref={ref} className="absolute inset-0 size-full mix-blend-screen" aria-hidden />;
}

/** Downloads the artwork as a PNG — used for licensed source files. */
export async function downloadArtwork(genome: Genome, filename: string) {
  const url = await renderToUrl(genome, 2048);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
