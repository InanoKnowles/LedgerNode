"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

type Wallet = {
  address: string | null;
  chainId: bigint | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  name: string | null;
  setName: (name: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchAccount: () => Promise<void>;
  needsName: boolean;
  closeNamePrompt: () => void;
};

const WalletCtx = createContext<Wallet | null>(null);

declare global {
  interface Window {
    ethereum?: any;
  }
}

const NAME_KEY_PREFIX = "ledgernode:name:";
const SIGNED_IN_KEY = "ledgernode:signed-in";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [name, setNameState] = useState<string | null>(null);
  const [needsName, setNeedsName] = useState(false);

  const loadNameFor = (addr: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(NAME_KEY_PREFIX + addr.toLowerCase());
  };

  const applyAccount = useCallback(async (p: BrowserProvider, addr: string) => {
    const s = await p.getSigner();
    const net = await p.getNetwork();
    setProvider(p);
    setSigner(s);
    setAddress(addr);
    setChainId(net.chainId);
    const stored = loadNameFor(addr);
    if (stored) {
      setNameState(stored);
      setNeedsName(false);
    } else {
      setNameState(null);
      setNeedsName(true);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIGNED_IN_KEY, "1");
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert(
        "MetaMask isn't installed in this browser. Install it from metamask.io using Chrome, Brave, Firefox or Edge, then try again."
      );
      return;
    }
    try {
      const p = new BrowserProvider(window.ethereum);
      const accounts: string[] = await p.send("eth_requestAccounts", []);
      const addr = accounts[0];
      if (!addr) return;
      await applyAccount(p, addr);
    } catch (e: any) {
      // user rejected, or some other error: stay disconnected
      console.warn("Sign-in cancelled:", e?.message ?? e);
    }
  }, [applyAccount]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setNameState(null);
    setNeedsName(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SIGNED_IN_KEY);
    }
  }, []);

  const switchAccount = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      // Ask MetaMask to re-prompt the account picker. This works in MetaMask.
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
      const p = new BrowserProvider(window.ethereum);
      const accounts: string[] = await p.send("eth_accounts", []);
      if (accounts && accounts.length > 0) {
        await applyAccount(p, accounts[0]);
      }
    } catch (e: any) {
      // user cancelled the picker, do nothing
      console.warn("Switch cancelled:", e?.message ?? e);
    }
  }, [applyAccount]);

  const setName = useCallback(
    (n: string) => {
      const trimmed = n.trim();
      if (!trimmed || !address) return;
      window.localStorage.setItem(NAME_KEY_PREFIX + address.toLowerCase(), trimmed);
      setNameState(trimmed);
      setNeedsName(false);
    },
    [address]
  );

  const closeNamePrompt = useCallback(() => setNeedsName(false), []);

  // Auto-reconnect on page load if the user signed in before
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const previouslySignedIn = window.localStorage.getItem(SIGNED_IN_KEY) === "1";
    if (!previouslySignedIn) return;

    (async () => {
      try {
        const p = new BrowserProvider(window.ethereum);
        // eth_accounts is silent (no popup); only returns if previously authorised
        const accounts: string[] = await p.send("eth_accounts", []);
        if (accounts && accounts.length > 0) {
          await applyAccount(p, accounts[0]);
        }
      } catch {
        // ignore; user can click Sign in to retry
      }
    })();
  }, [applyAccount]);

  // React to MetaMask account / chain switches
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const onAccounts = async (a: string[]) => {
      if (!a || a.length === 0) {
        disconnect();
        return;
      }
      const p = new BrowserProvider(window.ethereum);
      await applyAccount(p, a[0]);
    };
    const onChain = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [applyAccount, disconnect]);

  return (
    <WalletCtx.Provider
      value={{
        address,
        chainId,
        provider,
        signer,
        name,
        setName,
        connect,
        disconnect,
        switchAccount,
        needsName,
        closeNamePrompt
      }}
    >
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
