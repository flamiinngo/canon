"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { NearConnector } from "@hot-labs/near-connect";

export const NETWORK = (process.env.NEXT_PUBLIC_NEAR_NETWORK as "testnet" | "mainnet") ?? "testnet";

interface WalletState {
  accountId: string | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const connector = useRef<NearConnector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { NearConnector } = await import("@hot-labs/near-connect");
        const c = new NearConnector({ network: NETWORK, features: { [NETWORK]: true } });
        connector.current = c;
        c.on("wallet:signIn", (t) => !cancelled && setAccountId(t.accounts[0]?.accountId ?? null));
        c.on("wallet:signOut", () => !cancelled && setAccountId(null));
        try {
          const { accounts } = await c.getConnectedWallet();
          if (!cancelled) setAccountId(accounts[0]?.accountId ?? null);
        } catch {
          /* not connected yet */
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Wallet connector failed to load");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    if (!connector.current) return;
    setBusy(true);
    setError(null);
    try {
      await connector.current.connect();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/reject|cancel|closed/i.test(msg)) setError(msg);
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!connector.current) return;
    try {
      await connector.current.disconnect();
    } finally {
      setAccountId(null);
    }
  }, []);

  return <WalletContext.Provider value={{ accountId, ready, busy, error, connect, disconnect }}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
