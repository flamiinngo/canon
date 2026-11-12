import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { WorkStatus } from "@/lib/types";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-8 px-3.5 text-[13px]",
    size === "md" && "h-10 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "primary" && "bg-ink text-paper shadow-[inset_0_1px_0_oklch(1_0_0/0.12)] hover:bg-ink/88",
    variant === "accent" && "bg-accent text-accent-ink shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_8px_20px_-8px_var(--accent)] hover:brightness-105",
    variant === "secondary" && "bg-surface text-ink ring-1 ring-line-strong hover:ring-ink-3",
    variant === "ghost" && "text-ink-2 hover:bg-paper-2 hover:text-ink",
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3", className)}>
      {children}
    </p>
  );
}

export function Fig({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-wide text-ink-3">
      <span className="text-ink-2">Fig {n}</span>
      <span className="mx-2 text-line-strong">/</span>
      {children}
    </p>
  );
}

const statusStyles: Record<WorkStatus, string> = {
  approved: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
  rejected: "bg-bad-soft text-bad",
  revoked: "bg-bad-soft text-bad",
  flagged: "bg-bad-soft text-bad",
};

const statusLabel: Record<WorkStatus, string> = {
  approved: "Canon",
  pending: "Pending review",
  rejected: "Rejected",
  revoked: "Revoked",
  flagged: "Disputed",
};

export function StatusPill({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", statusStyles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function Chip({ children, className, tone = "neutral" }: { children: ReactNode; className?: string; tone?: "neutral" | "ok" | "bad" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        tone === "neutral" && "bg-paper-2 text-ink-2 ring-1 ring-line",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "bad" && "bg-bad-soft text-bad",
        tone === "accent" && "bg-accent-soft text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl bg-surface shadow-card ring-1 ring-line", className)} {...props} />;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] text-ink-2", className)}>{children}</span>;
}

/** Brand mark: three nodes joined by a lineage stroke. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <path d="M12 5 V 12 M12 12 L 6 19 M12 12 L 18 19" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="5" r="3" fill="var(--accent)" />
        <circle cx="6" cy="19" r="2.4" fill="currentColor" />
        <circle cx="18" cy="19" r="2.4" fill="currentColor" />
      </svg>
      <span className="font-display text-[26px] leading-none tracking-[-0.01em]">Canon</span>
    </span>
  );
}
