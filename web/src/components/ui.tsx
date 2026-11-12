import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { WorkStatus } from "@/lib/types";

type Variant = "primary" | "secondary" | "ghost" | "ember";
type Size = "sm" | "md" | "lg";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow,transform,opacity] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    size === "sm" && "h-8 px-3.5 text-[13px]",
    size === "md" && "h-10 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "primary" && "bg-fg text-bg shadow-[0_0_0_1px_rgb(255_255_255/0.2),0_8px_30px_-8px_rgb(255_255_255/0.35)] hover:bg-white",
    variant === "ember" && "bg-ember text-[#130904] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_40px_-10px_var(--ember)] hover:brightness-110",
    variant === "secondary" && "bg-white/[0.04] text-fg ring-1 ring-line-2 backdrop-blur hover:bg-white/[0.08] hover:ring-line-3",
    variant === "ghost" && "text-fg-2 hover:bg-white/[0.05] hover:text-fg",
    className,
  );
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3", className)}>{children}</p>;
}

export function SectionHead({ label, title, body, className }: { label: string; title: ReactNode; body?: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <Label>{label}</Label>
      <h2 className="display mt-5 text-[40px] text-fg sm:text-[56px] lg:text-[64px]">{title}</h2>
      {body && <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-fg-2">{body}</p>}
    </div>
  );
}

const STATUS: Record<WorkStatus, [string, string]> = {
  approved: ["Canon", "text-ok bg-ok/10 ring-ok/25"],
  pending: ["Pending review", "text-warn bg-warn/10 ring-warn/25"],
  rejected: ["Rejected", "text-bad bg-bad/10 ring-bad/25"],
  revoked: ["Revoked", "text-bad bg-bad/10 ring-bad/25"],
  flagged: ["Disputed", "text-bad bg-bad/10 ring-bad/25"],
};

export function StatusPill({ status, className }: { status: WorkStatus; className?: string }) {
  const [label, cls] = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 backdrop-blur", cls, className)}>
      <span className="size-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {label}
    </span>
  );
}

export function Chip({ children, className, tone = "neutral" }: { children: ReactNode; className?: string; tone?: "neutral" | "ok" | "bad" | "ember" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1",
        tone === "neutral" && "bg-white/[0.03] text-fg-2 ring-line-2",
        tone === "ok" && "bg-ok/10 text-ok ring-ok/20",
        tone === "bad" && "bg-bad/10 text-bad ring-bad/20",
        tone === "ember" && "bg-ember/10 text-ember ring-ember/25",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("panel", className)} {...props} />;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] text-fg-2", className)}>{children}</span>;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
        <defs>
          <linearGradient id="canon-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff6a3d" />
            <stop offset="0.5" stopColor="#a98bff" />
            <stop offset="1" stopColor="#52d6ff" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="27" height="27" rx="8" fill="#0f1115" stroke="rgb(255 255 255 / 0.14)" />
        <path d="M14 7.5 V14 M14 14 L8.5 20 M14 14 L19.5 20" stroke="url(#canon-mark)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="14" cy="7.5" r="2.6" fill="#ff6a3d" />
        <circle cx="8.5" cy="20.5" r="2.1" fill="#a98bff" />
        <circle cx="19.5" cy="20.5" r="2.1" fill="#52d6ff" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-fg">canon</span>
    </span>
  );
}
