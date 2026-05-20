"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";

export default function NamePrompt() {
  const { needsName, setName, closeNamePrompt, address } = useWallet();
  const [value, setValue] = useState("");

  // Reset the input when the prompt opens for a new account
  useEffect(() => {
    if (needsName) setValue("");
  }, [needsName, address]);

  if (!needsName) return null;

  function save() {
    if (!value.trim()) return;
    setName(value);
  }

  function skip() {
    closeNamePrompt();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={skip}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cream w-full max-w-md rounded-soft shadow-lift p-6 sm:p-8"
      >
        <div className="w-12 h-12 rounded-full bg-butter flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C5545" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">Welcome to LedgerNode</h2>
        <p className="text-sm text-ink/70 mt-2 mb-5">
          What should we call you? We&apos;ll use this to greet you when you sign in.
          It&apos;s saved on your device only, not on the blockchain.
        </p>

        <label className="block">
          <span className="block text-sm font-semibold mb-1.5">Your name</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="e.g. Inano"
            className="w-full bg-white border border-ink/15 rounded-soft px-4 py-3 text-base min-h-[48px] focus:outline-none focus:border-forest"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            onClick={save}
            disabled={!value.trim()}
            className="flex-1 bg-forest text-cream hover:bg-forest-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-pill px-5 py-3 font-semibold min-h-[48px] transition-colors"
          >
            Save
          </button>
          <button
            onClick={skip}
            className="flex-1 sm:flex-initial border border-ink/20 hover:border-forest text-ink rounded-pill px-5 py-3 font-semibold min-h-[48px] transition-colors"
          >
            Skip for now
          </button>
        </div>

        {address ? (
          <p className="text-xs text-ink/50 mt-4 font-mono break-all">
            Signed in as {address.slice(0, 6)}…{address.slice(-4)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
