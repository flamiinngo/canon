"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { NearConnector } from "@hot-labs/near-connect";
import { CONTRACT, NETWORK_ID } from "@/lib/near";

export const NETWORK = NETWORK_ID;

export interface TxResult {
  hash: string;
  /** JSON return value of the called method, if any. */
  value: unknown;
}

interface WalletState {
  accountId: string | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Signs and sends one function call to the Canon registry. */
  call: (method: string, args: Record<string, unknown>, depositYocto: string, gasTgas?: number) => Promise<TxResult>;
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

  const call = useCallback(async (method: string, args: Record<string, unknown>, depositYocto: string, gasTgas = 100): Promise<TxResult> => {
    if (!connector.current) throw new Error("Wallet connector is not ready");
    if (!CONTRACT) throw new Error("No registry contract configured");
    const wallet = await connector.current.wallet();
    const outcome = await wallet.signAndSendTransaction({
      receiverId: CONTRACT,
      actions: [
        {
          type: "FunctionCall",
          params: { methodName: method, args, gas: (BigInt(gasTgas) * BigInt(10) ** BigInt(12)).toString(), deposit: depositYocto },
        },
      ],
    });
    const status = outcome.status as { SuccessValue?: string; Failure?: unknown };
    if (status && typeof status === "object" && "Failure" in status && status.Failure) {
      throw new Error(JSON.stringify(status.Failure).match(/ERR_[A-Z_]+/)?.[0] ?? "Transaction failed");
    }
    let value: unknown = null;
    if (status?.SuccessValue) {
      try {
        value = JSON.parse(atob(status.SuccessValue));
      } catch {
        value = null;
      }
    }
    return { hash: outcome.transaction_outcome?.id ?? outcome.transaction?.hash ?? "", value };
  }, []);

  return <WalletContext.Provider value={{ accountId, ready, busy, error, connect, disconnect, call }}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
