"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { fetchWorks, LIVE } from "@/lib/near";
import { setWorks, subscribeWorks, worksVersion } from "@/lib/data";

type Status = "preview" | "loading" | "live" | "error";
let status: Status = LIVE ? "loading" : "preview";
let lastError: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function refreshWorks() {
  if (!LIVE) return;
  try {
    const works = await fetchWorks();
    setWorks(works);
    status = "live";
    lastError = null;
  } catch (e) {
    status = "error";
    lastError = e instanceof Error ? e.message : String(e);
  }
  emit();
}

/** Loads on-chain works once when a registry contract is configured. */
export function CanonDataProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (LIVE) void refreshWorks();
  }, []);
  return <>{children}</>;
}

/** Subscribe a component to dataset changes. */
export function useCanonData() {
  useSyncExternalStore(subscribeWorks, worksVersion, () => 0);
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => (LIVE ? "loading" : "preview") as Status,
  );
  return { status: s, live: LIVE, error: lastError, refresh: refreshWorks };
}
