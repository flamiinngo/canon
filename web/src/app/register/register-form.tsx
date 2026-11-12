"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, GitFork, ImageUp, Plus, Shuffle, Sparkles, Trash2, Wallet } from "lucide-react";
import { Artwork } from "@/components/artwork";
import { refreshWorks, useCanonData } from "@/components/canon-data";
import { Button, Chip, Label } from "@/components/ui";
import { useWallet } from "@/components/wallet";
import { PALETTES, type Genome, type PaletteName, type Style, type Transform } from "@/lib/art";
import { WORKS, getWork } from "@/lib/data";
import { EXPLORER, LIVE, encodeGenome, nearToYocto } from "@/lib/near";
import { cn } from "@/lib/cn";

interface SplitRow {
  account: string;
  role: string;
  pct: number;
}

const STYLES: Style[] = ["flow", "rings", "strata"];
const TRANSFORMS: { id: Transform; label: string; kind: string }[] = [
  { id: "relief", label: "3D relief", kind: "3D relief" },
  { id: "motion", label: "Motion", kind: "Motion loop" },
  { id: "recolor", label: "Colourway", kind: "Colourway" },
  { id: "fragment", label: "Remix", kind: "Remix" },
  { id: "pixel", label: "Pixel", kind: "Pixel edition" },
];
const ACCOUNT_RE = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$|^[0-9a-f]{64}$/;

export function RegisterForm() {
  const router = useRouter();
  const { accountId, connect, busy, call } = useWallet();
  useCanonData();
  const [mode, setMode] = useState<"original" | "derivative">("original");
  const [source, setSource] = useState<"generate" | "upload">("generate");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<{ name: string; url: string; hash: string } | null>(null);
  const [base, setBase] = useState<Genome>({ seed: 31337, style: "flow", palette: "tidal", transforms: [] });
  const [parentId, setParentId] = useState("");
  const [transform, setTransform] = useState<Transform>("relief");
  const [recolor, setRecolor] = useState<PaletteName>("nocturne");
  const [derivatives, setDerivatives] = useState(true);
  const [commercial, setCommercial] = useState(true);
  const [upstream, setUpstream] = useState(20);
  const [price, setPrice] = useState(50);
  const [splits, setSplits] = useState<SplitRow[]>([{ account: "", role: "Artist", pct: 100 }]);
  const [state, setState] = useState<{ phase: "idle" | "signing" | "done" | "error"; text?: string; hash?: string }>({ phase: "idle" });

  const parents = WORKS.filter((w) => w.status === "approved" && w.terms.derivatives);
  useEffect(() => {
    if (mode === "derivative" && !parents.find((p) => p.id === parentId)) setParentId(parents[0]?.id ?? "");
  }, [mode, parents, parentId]);
  const parent = parentId ? getWork(parentId) : undefined;

  const genome: Genome = useMemo(() => {
    if (mode === "derivative" && parent)
      return { ...parent.genome, palette: transform === "recolor" ? recolor : parent.genome.palette, transforms: [...parent.genome.transforms, transform] };
    return base;
  }, [mode, parent, transform, recolor, base]);
  const kind = mode === "derivative" ? TRANSFORMS.find((t) => t.id === transform)!.kind : "Original artwork";

  const owner = accountId ?? "";
  const rows = splits.map((s, i) => (i === 0 ? { ...s, account: owner || s.account } : s));
  const total = rows.reduce((a, s) => a + (Number.isFinite(s.pct) ? s.pct : 0), 0);
  const accountsOk = rows.every((s) => ACCOUNT_RE.test(s.account) && s.account.length >= 2);
  const uniqueOk = new Set(rows.map((r) => r.account)).size === rows.length;
  const splitsOk = Math.abs(total - 100) < 1e-9 && accountsOk && uniqueOk && rows.every((r) => r.pct > 0);
  const hasArt = source === "generate" || !!file;
  const slug = useMemo(() => title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "untitled", [title]);
  const slugTaken = !!getWork(slug);
  const derivativeOk = mode === "original" || !!parent;
  const valid = title.trim().length > 1 && splitsOk && hasArt && !slugTaken && derivativeOk && (!commercial || price > 0);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const digest = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    setFile({ name: f.name, url: URL.createObjectURL(f), hash: hex });
  };

  const payload = {
    token_id: slug,
    title: title.trim(),
    description: description.trim() || null,
    media: source === "generate" ? encodeGenome(genome, kind) : null,
    file_hash: source === "upload" && file ? `sha256:${file.hash}` : `genome:${genome.seed}:${genome.style}:${genome.palette}:${genome.transforms.join("+") || "-"}`,
    terms: { derivatives, commercial, upstream_bps: derivatives ? upstream * 100 : 0, price: commercial ? nearToYocto(price) : "0" },
    owner_bps: Math.round(rows[0].pct * 100),
    contributors: rows.slice(1).map((r) => ({ account_id: r.account, role: r.role, bps: Math.round(r.pct * 100) })),
    parent_id: mode === "derivative" ? parentId : null,
  };

  const submit = async () => {
    if (!valid) return;
    if (!LIVE) return setState({ phase: "done", text: "Preview mode: this is the exact call the contract would receive." });
    setState({ phase: "signing" });
    try {
      // 0.1 NEAR covers storage plus the 0.03 NEAR vault deposit; the contract refunds the rest.
      const r = await call("register_work", payload, nearToYocto("0.1"), 150);
      if (r.value === false) throw new Error("The vault could not be created, so the registration was rolled back and refunded.");
      setState({ phase: "done", text: mode === "derivative" ? "Submitted. It joins the lineage when the parent's owner approves." : "Registered with a keyless vault.", hash: r.hash });
      await refreshWorks();
      router.push(`/works/${slug}`);
    } catch (e) {
      setState({ phase: "error", text: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="01 · What are you registering?">
          <div className="grid gap-2 sm:grid-cols-2">
            <ModeCard active={mode === "original"} onClick={() => setMode("original")} title="An original" note="Starts a new lineage. Approved immediately." icon={<Sparkles className="size-4" />} />
            <ModeCard active={mode === "derivative"} onClick={() => setMode("derivative")} title="A derivative" note="Builds on an existing work. Needs its owner's approval." icon={<GitFork className="size-4" />} />
          </div>
        </Field>

        <Field label="02 · Artwork">
          {mode === "derivative" ? (
            parents.length === 0 ? (
              <p className="rounded-2xl border border-line p-4 text-sm text-fg-3">No works currently accept derivatives. Register an original first.</p>
            ) : (
              <div className="space-y-4">
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={input}>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.owner} · takes {p.terms.upstreamBps / 100}% upstream
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {TRANSFORMS.map((t) => (
                    <button key={t.id} type="button" onClick={() => setTransform(t.id)} className={cn("rounded-xl px-3.5 py-2 text-[13px] ring-1 transition-colors", transform === t.id ? "bg-white/[0.07] text-fg ring-line-3" : "text-fg-3 ring-line hover:text-fg")}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {transform === "recolor" && <PalettePicker value={recolor} onChange={setRecolor} />}
                <p className="font-mono text-[11px] text-fg-3">derived from {parent?.id} · base + {genome.transforms.join(" + ")}</p>
              </div>
            )
          ) : (
            <>
              <div className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-line">
                {(["generate", "upload"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSource(s)} className={cn("rounded-full px-4 py-1.5 text-[13px] transition-colors", source === s ? "bg-fg text-bg" : "text-fg-3 hover:text-fg")}>
                    {s === "generate" ? "Generate an original" : "Hash a file"}
                  </button>
                ))}
              </div>
              {source === "generate" ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <button key={s} type="button" onClick={() => setBase((g) => ({ ...g, style: s }))} className={cn("rounded-xl px-3.5 py-2 text-[13px] capitalize ring-1 transition-colors", base.style === s ? "bg-white/[0.07] text-fg ring-line-3" : "text-fg-3 ring-line hover:text-fg")}>
                        {s}
                      </button>
                    ))}
                    <button type="button" onClick={() => setBase((g) => ({ ...g, seed: Math.floor(Math.random() * 1e6) }))} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] text-fg-2 ring-1 ring-line hover:text-fg">
                      <Shuffle className="size-3.5" /> New seed
                    </button>
                  </div>
                  <PalettePicker value={base.palette} onChange={(p) => setBase((g) => ({ ...g, palette: p }))} />
                  <p className="font-mono text-[11px] text-fg-3">
                    seed {base.seed} · {base.style} · {base.palette}
                  </p>
                </div>
              ) : (
                <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-3 bg-white/[0.02] px-6 py-12 text-center transition-colors hover:border-fg/50">
                  <ImageUp className="size-6 text-fg-3" />
                  <span className="text-sm text-fg">{file ? file.name : "Choose an image to fingerprint"}</span>
                  <span className="max-w-full truncate font-mono text-[11px] text-fg-3">{file ? `sha256:${file.hash}` : "The file never leaves your device; only its SHA-256 is recorded."}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
              )}
            </>
          )}
        </Field>

        <Field label="03 · Identity">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "derivative" && parent ? `${parent.title} — ${TRANSFORMS.find((t) => t.id === transform)?.label}` : "Title, e.g. Ember Field"} className={input} maxLength={80} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" rows={2} className={cn(input, "mt-2 h-auto py-3")} maxLength={280} />
          <p className={cn("mt-2 font-mono text-[11px]", slugTaken ? "text-bad" : "text-fg-3")}>
            {slugTaken ? `“${slug}” is already registered. Choose another title.` : `token ${slug} · vault ${slug}.${process.env.NEXT_PUBLIC_CANON_CONTRACT || "canon.near"} · 0 access keys`}
          </p>
        </Field>

        <Field label="04 · Terms">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle on={derivatives} setOn={setDerivatives} title="Allow derivatives" note="Others can submit works based on this" />
            <Toggle on={commercial} setOn={setCommercial} title="Allow commercial use" note="Studios can license it and its lineage" />
          </div>
          {derivatives && (
            <div className="mt-3 rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg">Upstream share from derivatives</span>
                <span className="num text-fg">{upstream}%</span>
              </div>
              <input type="range" min={0} max={50} value={upstream} onChange={(e) => setUpstream(+e.target.value)} className="mt-3 w-full accent-[var(--ember)]" />
              <p className="mt-1 text-xs text-fg-3">Every licence of a derivative sends this share up to your vault.</p>
            </div>
          )}
          {commercial && (
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
              <span className="text-sm text-fg">Licence price</span>
              <span className="flex items-center gap-2">
                <input type="number" min={0.01} step={0.01} value={price} onChange={(e) => setPrice(+e.target.value)} className={cn(input, "num h-9 w-24 text-right")} />
                <span className="text-sm text-fg-3">Ⓝ</span>
              </span>
            </div>
          )}
        </Field>

        <Field label="05 · Contributors" hint="Shares must total exactly 100%. Row one is the owner's share: it is paid into the vault and moves with the NFT. Other rows are paid to people.">
          <div className="space-y-2">
            {rows.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_96px_44px] gap-2 sm:grid-cols-[1.4fr_1fr_96px_44px]">
                <input
                  value={s.account}
                  disabled={i === 0 && !!owner}
                  onChange={(e) => setSplits((x) => x.map((r, j) => (j === i ? { ...r, account: e.target.value.trim().toLowerCase() } : r)))}
                  placeholder={i === 0 ? "owner (connect wallet)" : "collaborator.testnet"}
                  className={cn(input, "font-mono text-[13px] disabled:opacity-70")}
                />
                <input value={s.role} onChange={(e) => setSplits((x) => x.map((r, j) => (j === i ? { ...r, role: e.target.value } : r)))} placeholder="Role" className={cn(input, "hidden sm:block")} maxLength={40} />
                <div className="relative">
                  <input type="number" value={s.pct} onChange={(e) => setSplits((x) => x.map((r, j) => (j === i ? { ...r, pct: +e.target.value } : r)))} className={cn(input, "num pr-7 text-right")} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-3">%</span>
                </div>
                <button type="button" disabled={i === 0} onClick={() => setSplits((x) => x.filter((_, j) => j !== i))} className="flex h-11 items-center justify-center rounded-xl text-fg-3 ring-1 ring-line hover:text-bad disabled:opacity-25" aria-label="Remove contributor">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="ghost" size="sm" disabled={rows.length >= 9} onClick={() => setSplits((x) => [...x, { account: "", role: "Contributor", pct: 0 }])}>
                <Plus className="size-3.5" /> Add contributor
              </Button>
              <span className={cn("num text-sm", splitsOk ? "text-ok" : "text-bad")}>{total}% / 100%</span>
            </div>
          </div>
        </Field>

        <div className="flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center">
          {accountId ? (
            <Button type="submit" variant="ember" size="lg" disabled={!valid || state.phase === "signing"}>
              <Sparkles className="size-4" /> {state.phase === "signing" ? "Waiting for your wallet…" : mode === "derivative" ? "Submit for approval" : "Register on NEAR"}
            </Button>
          ) : (
            <Button type="button" variant="primary" size="lg" onClick={connect} disabled={busy}>
              <Wallet className="size-4" /> {busy ? "Connecting…" : "Connect wallet to register"}
            </Button>
          )}
          {!valid && accountId && <p className="text-xs text-fg-3">Add a title and shares that total 100% with valid, distinct account IDs.</p>}
          {LIVE && accountId && <p className="text-xs text-fg-3">Attaches 0.1 Ⓝ for storage and the vault; the surplus is refunded.</p>}
        </div>
        {state.phase === "error" && <p className="rounded-2xl border border-bad/25 bg-bad/[0.07] p-4 text-sm text-bad">{state.text}</p>}
        {state.phase === "done" && (
          <div className="rounded-2xl border border-ok/25 bg-ok/[0.07] p-4 text-sm text-ok">
            <p className="flex items-center gap-2 font-medium">
              <Check className="size-4" /> {state.text}
              {state.hash && (
                <a href={`${EXPLORER}/txns/${state.hash}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  View transaction ↗
                </a>
              )}
            </p>
            {!LIVE && <pre className="mt-3 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-fg-2">{JSON.stringify({ method: "register_work", args: payload }, null, 2)}</pre>}
          </div>
        )}
      </form>

      {/* Preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Label className="mb-3">Preview</Label>
        <div className="overflow-hidden rounded-[24px] border border-line bg-surface">
          {mode === "original" && source === "upload" && file ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt="" className="aspect-square w-full object-cover" />
          ) : mode === "original" && source === "upload" ? (
            <div className="flex aspect-square items-center justify-center bg-bg-2 text-sm text-fg-3">Your file appears here</div>
          ) : (
            <Artwork genome={genome} className="aspect-square w-full" size={720} live />
          )}
          <div className="space-y-3 p-5">
            <div>
              <p className="text-[22px] font-medium tracking-[-0.03em] text-fg">{title || "Untitled work"}</p>
              <p className="font-mono text-[11px] text-fg-3">
                {kind}
                {parent && mode === "derivative" ? ` · from ${parent.title}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mode === "derivative" && <Chip tone="ember">Pending until approved</Chip>}
              <Chip tone={derivatives ? "ok" : "neutral"}>Derivatives {derivatives ? "on" : "off"}</Chip>
              <Chip tone={commercial ? "ok" : "bad"}>Commercial {commercial ? "on" : "off"}</Chip>
              {derivatives && <Chip>{upstream}% upstream</Chip>}
              {commercial && <Chip>{price} Ⓝ</Chip>}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

const input = "h-11 w-full rounded-xl bg-white/[0.03] px-3.5 text-sm text-fg ring-1 ring-line outline-none transition-shadow placeholder:text-fg-3 focus:ring-2 focus:ring-fg/40";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">{label}</p>
      {hint && <p className="mt-1 text-xs text-fg-3">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ModeCard({ active, onClick, title, note, icon }: { active: boolean; onClick: () => void; title: string; note: string; icon: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors", active ? "border-fg/40 bg-white/[0.05]" : "border-line hover:border-line-2")}>
      <span className={cn("mt-0.5", active ? "text-ember" : "text-fg-3")}>{icon}</span>
      <span>
        <span className="block text-sm text-fg">{title}</span>
        <span className="block text-xs text-fg-3">{note}</span>
      </span>
    </button>
  );
}

function PalettePicker({ value, onChange }: { value: PaletteName; onChange: (p: PaletteName) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(PALETTES) as PaletteName[]).map((p) => (
        <button key={p} type="button" onClick={() => onChange(p)} aria-label={`Palette ${p}`} className={cn("flex h-9 overflow-hidden rounded-xl ring-1 transition-transform", value === p ? "scale-105 ring-fg" : "ring-line hover:ring-line-3")}>
          {PALETTES[p].slice(0, 5).map((c) => (
            <span key={c} className="w-4" style={{ background: c }} />
          ))}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, setOn, title, note }: { on: boolean; setOn: (v: boolean) => void; title: string; note: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => setOn(!on)} className={cn("flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors", on ? "border-fg/30 bg-white/[0.05]" : "border-line")}>
      <span>
        <span className="block text-sm text-fg">{title}</span>
        <span className="block text-xs text-fg-3">{note}</span>
      </span>
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-ember" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-fg shadow transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
    </button>
  );
}
