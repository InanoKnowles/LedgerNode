"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/wallet";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy a share" },
  { href: "/sell", label: "Sell your home" },
  { href: "/rent", label: "Rent" },
  { href: "/verify", label: "For inspectors" }
];

export default function Frame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, name, connect, disconnect, switchAccount } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close the account menu when clicking outside it
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-ink/10">
        <div className="wrap flex items-center gap-4 py-4">
          <Link href="/" className="flex items-baseline gap-2 mr-2">
            <span className="h-card font-display font-semibold text-forest">LedgerNode</span>
            <span className="hidden md:inline text-xs text-ink/50 font-medium">Homes you can share in</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 ml-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm font-semibold hover:text-terracotta transition-colors ${
                  pathname === n.href ? "text-terracotta" : "text-ink/80"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {address ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  className="flex items-center gap-2 border border-forest/30 text-forest hover:bg-forest hover:text-cream rounded-pill pl-2 pr-3 sm:pl-2 sm:pr-4 py-1.5 sm:py-2 text-sm font-semibold min-h-[44px] transition-colors"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="w-7 h-7 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold uppercase">
                    {name ? name.charAt(0) : "•"}
                  </span>
                  <span className="hidden xs:inline">
                    {name ? `Hi, ${name.split(" ")[0]}` : "Signed in"}
                  </span>
                  <svg
                    className={`w-3 h-3 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="2 4 6 8 10 4" />
                  </svg>
                </button>
                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-cream border border-ink/10 rounded-soft shadow-lift p-2 z-40"
                  >
                    <div className="px-3 py-2.5 border-b border-ink/10 mb-1">
                      <p className="text-xs text-ink/55 font-semibold uppercase tracking-wide">Signed in as</p>
                      <p className="text-sm font-semibold truncate">{name ?? "No name set"}</p>
                      <p className="text-xs text-ink/55 font-mono truncate mt-0.5" title={address}>
                        {address.slice(0, 10)}…{address.slice(-6)}
                      </p>
                    </div>
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setAccountMenuOpen(false);
                        await switchAccount();
                      }}
                      className="w-full text-left px-3 py-3 rounded-soft hover:bg-bone text-sm font-medium min-h-[44px] flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      Switch account
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        disconnect();
                      }}
                      className="w-full text-left px-3 py-3 rounded-soft hover:bg-terracotta-soft text-sm font-medium min-h-[44px] flex items-center gap-2 text-terracotta"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                onClick={connect}
                className="bg-forest text-cream hover:bg-forest-dark rounded-pill px-4 py-2.5 text-sm font-semibold min-h-[44px] transition-colors"
              >
                Sign in
              </button>
            )}

            <button
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="lg:hidden border-t border-ink/10 bg-cream">
            <div className="wrap py-4 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-3 px-2 rounded-soft text-base font-semibold min-h-[48px] ${
                    pathname === n.href ? "bg-terracotta-soft text-terracotta" : "text-ink hover:bg-bone"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
              {address ? (
                <button
                  onClick={() => {
                    disconnect();
                    setMenuOpen(false);
                  }}
                  className="mt-3 text-left py-3 px-2 rounded-soft text-base font-semibold text-terracotta hover:bg-terracotta-soft min-h-[48px]"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-forest text-cream mt-20">
        <div className="wrap py-10 sm:py-14 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="h-card font-display font-semibold">LedgerNode</p>
            <p className="body-sm text-cream/70 mt-2 max-w-md">
              A friendlier way to own, sell, or rent a home. Share in a property
              from as little as the cost of a coffee a day, or sell a slice of your
              own home without giving up the keys.
            </p>
          </div>
          <div>
            <p className="eyebrow text-cream/80 mb-3">Helpful links</p>
            <ul className="space-y-2 body-sm text-cream/80">
              <li><Link href="/how-it-works">How it works</Link></li>
              <li><Link href="/buy">Buy a share</Link></li>
              <li><Link href="/sell">Sell your home</Link></li>
              <li><Link href="/rent">Find a rental</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-cream/80 mb-3">Safe & checked</p>
            <ul className="space-y-2 body-sm text-cream/80">
              <li>Every home is inspected</li>
              <li>Every buyer is verified</li>
              <li>Rent is paid automatically</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cream/15">
          <div className="wrap py-5 text-xs text-cream/60 flex flex-wrap gap-3 justify-between">
            <span>© 2026 LedgerNode. A student project, IFB452 QUT.</span>
            <span>Made in Brisbane.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
