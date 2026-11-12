"use client";

import { useState } from "react";
import { Check, ImageUp, Plus, Trash2 } from "lucide-react";
import { Character } from "@/components/character";
import { Button, Card, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";

interface SplitRow {
  account: string;
  role: string;
  pct: number;
}

export function RegisterForm() {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Original character");
  const [file, setFile] = useState<{ name: string; url: string; hash: string } | null>(null);
  const [derivatives, setDerivatives] = useState(true);
  const [commercial, setCommercial] = useState(true);
  const [upstream, setUpstream] = useState(20);
  const [price, setPrice] = useState(50);
  const [splits, setSplits] = useState<SplitRow[]>([{ account: "you.near", role: "Creator", pct: 100 }]);
  const [done, setDone] = useState(false);

  const total = splits.reduce((a, s) => a + (Number.isFinite(s.pct) ? s.pct : 0), 0);
  const splitsOk = Math.abs(total - 100) < 1e-9 && splits.every((s) => /^[a-z0-9_.-]+\.(near|testnet)$/.test(s.account));
  const valid = title.trim().length > 1 && splitsOk && !!file;
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "your-work";

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const buf = await f.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    setFile({ name: f.name, url: URL.createObjectURL(f), hash: hex });
  };

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setDone(true);
        }}
      >
        <Field label="Artwork" hint="PNG, JPG or SVG. Hashed locally with SHA-256.">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center transition-colors hover:border-accent">
            <ImageUp className="size-6 text-ink-3" />
            <span className="text-sm text-ink">{file ? file.name : "Drop a file or click to upload"}</span>
            {file && <span className="max-w-full truncate font-mono text-[11px] text-ink-3">sha256:{file.hash}</span>}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Zuri" className={inputCls} />
          </Field>
          <Field label="Kind">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
              {["Original character", "Mascot", "Illustration", "3D model", "Game asset"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Terms">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle on={derivatives} setOn={setDerivatives} title="Allow derivatives" note="Others can submit works based on this" />
            <Toggle on={commercial} setOn={setCommercial} title="Allow commercial use" note="Studios can license it and its lineage" />
          </div>
          {derivatives && (
            <div className="mt-4 rounded-xl p-4 ring-1 ring-line">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">Upstream share from derivatives</span>
                <span className="num font-medium text-ink">{upstream}%</span>
              </div>
              <input type="range" min={0} max={50} value={upstream} onChange={(e) => setUpstream(+e.target.value)} className="mt-3 w-full accent-[var(--accent)]" />
              <p className="mt-1 text-xs text-ink-3">Every licence of a derivative sends this share up to your vault.</p>
            </div>
          )}
          {commercial && (
            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl p-4 ring-1 ring-line">
              <span className="text-sm text-ink">Licence price</span>
              <span className="flex items-center gap-2">
                <input type="number" min={1} value={price} onChange={(e) => setPrice(+e.target.value)} className={cn(inputCls, "num h-9 w-24 text-right")} />
                <span className="text-sm text-ink-3">Ⓝ</span>
              </span>
            </div>
          )}
        </Field>

        <Field label="Contributors" hint="Splits must total exactly 100%. The first row is the owner and is paid into the vault.">
          <div className="space-y-2">
            {splits.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.3fr_1fr_90px_auto]">
                <input
                  value={s.account}
                  onChange={(e) => setSplits((x) => x.map((r, j) => (j === i ? { ...r, account: e.target.value.trim().toLowerCase() } : r)))}
                  placeholder="account.near"
                  className={cn(inputCls, "font-mono text-[13px]")}
                />
                <input
                  value={s.role}
                  onChange={(e) => setSplits((x) => x.map((r, j) => (j === i ? { ...r, role: e.target.value } : r)))}
                  placeholder="Role"
                  className={cn(inputCls, "order-3 col-span-1 sm:order-none")}
                />
                <div className="relative order-4 sm:order-none">
                  <input
                    type="number"
                    value={s.pct}
                    onChange={(e) => setSplits((x) => x.map((r, j) => (j === i ? { ...r, pct: +e.target.value } : r)))}
                    className={cn(inputCls, "num pr-7 text-right")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">%</span>
                </div>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => setSplits((x) => x.filter((_, j) => j !== i))}
                  className="flex size-11 items-center justify-center rounded-xl text-ink-3 ring-1 ring-line hover:text-bad disabled:opacity-30"
                  aria-label="Remove contributor"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSplits((x) => [...x, { account: "", role: "Contributor", pct: 0 }])}>
                <Plus className="size-3.5" /> Add contributor
              </Button>
              <span className={cn("num text-sm", splitsOk ? "text-ok" : "text-bad")}>{total}% / 100%</span>
            </div>
          </div>
        </Field>

        <Button type="submit" variant="accent" size="lg" disabled={!valid} className="w-full sm:w-auto">
          Register on NEAR
        </Button>
        {done && (
          <p className="flex items-center gap-2 text-sm text-ok">
            <Check className="size-4" /> Ready to sign: mints the NFT and creates <span className="font-mono">{slug}.canon.near</span> with no access keys.
          </p>
        )}
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Preview</p>
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-paper-2">
            {file ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.url} alt="" className="size-full object-cover" />
            ) : (
              <Character art={{ species: "fox", hue: 38, variant: "flat" }} className="opacity-40 grayscale" />
            )}
          </div>
          <div className="space-y-3 p-5">
            <div>
              <p className="font-display text-3xl leading-tight">{title || "Untitled work"}</p>
              <p className="font-mono text-[11px] text-ink-3">{slug}.canon.near</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip tone={derivatives ? "ok" : "neutral"}>Derivatives {derivatives ? "on" : "off"}</Chip>
              <Chip tone={commercial ? "ok" : "bad"}>Commercial {commercial ? "on" : "off"}</Chip>
              {derivatives && <Chip>{upstream}% upstream</Chip>}
              {commercial && <Chip>{price} Ⓝ</Chip>}
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl bg-surface px-3.5 text-sm text-ink ring-1 ring-line outline-none transition-shadow placeholder:text-ink-3 focus:ring-2 focus:ring-accent";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Toggle({ on, setOn, title, note }: { on: boolean; setOn: (v: boolean) => void; title: string; note: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={cn("flex items-center justify-between gap-3 rounded-xl p-4 text-left ring-1 transition-colors", on ? "bg-accent-soft/40 ring-accent" : "ring-line")}
    >
      <span>
        <span className="block text-sm text-ink">{title}</span>
        <span className="block text-xs text-ink-3">{note}</span>
      </span>
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-accent" : "bg-line-strong")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-surface shadow transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
    </button>
  );
}
