"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "ethers";
import Link from "next/link";
import Frame from "@/components/Frame";
import { Button, Card, Eyebrow, Field, Input, Notice, Pill } from "@/components/ui";
import { WalletProvider, useWallet } from "@/lib/wallet";
import { getExchange, getUSDC, ADDRESSES } from "@/lib/contracts";

export default function Page() {
  return (
    <Frame>
      <BuyPage />
    </Frame>
  );
}

const SAMPLE_HOMES = [
  {
    id: 1,
    title: "42 Baker Street",
    suburb: "New Farm, QLD",
    price: "$100",
    yieldPct: "6.2%",
    sharesLeft: "3,847",
    bg: "from-butter via-terracotta-soft to-sky"
  },
  {
    id: 2,
    title: "12 Coral Lane",
    suburb: "West End, QLD",
    price: "$120",
    yieldPct: "5.8%",
    sharesLeft: "1,205",
    bg: "from-sky via-butter to-terracotta-soft"
  },
  {
    id: 3,
    title: "8 Henderson Place",
    suburb: "Paddington, QLD",
    price: "$95",
    yieldPct: "6.5%",
    sharesLeft: "5,002",
    bg: "from-terracotta-soft via-butter to-sky"
  }
];

function BuyPage() {
  return (
    <>
      <Header />
      <SignInExplainer />
      <HomesList />
      <BuyFlow />
      <YourSlices />
    </>
  );
}

function Header() {
  return (
    <section className="grain bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>For people who want to invest</Eyebrow>
        <h1 className="h-display mt-3 max-w-4xl">
          Pick a home. <span className="text-terracotta italic">Buy a slice.</span>
        </h1>
        <p className="body-lg text-ink/75 mt-5 max-w-2xl">
          These are real homes (well, examples for the demo). Choose one,
          decide how many slices you want, and the rest happens automatically.
        </p>
      </div>
    </section>
  );
}

function SignInExplainer() {
  const { address, connect } = useWallet();
  if (address) return null;
  return (
    <section className="bg-bone">
      <div className="wrap py-8 sm:py-10">
        <Card className="flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="w-12 h-12 rounded-full bg-butter flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C5545" strokeWidth="2.5">
              <path d="M12 2 L4 6 v6 c0 5 3.5 9.5 8 10 4.5 -0.5 8 -5 8 -10 V6 z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl sm:text-2xl font-semibold mb-1">First time? Let’s get you signed in.</h2>
            <p className="body-sm text-ink/75">
              You sign in with a free secure account that lives in your browser.
              No password to remember. No bank details. We’ll guide you the first time.
            </p>
          </div>
          <Button onClick={connect} tone="primary">Sign in</Button>
        </Card>
      </div>
    </section>
  );
}

function HomesList() {
  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <Eyebrow>Available now</Eyebrow>
            <h2 className="h-section mt-2">3 homes ready to share</h2>
          </div>
          <span className="hidden sm:block text-sm text-ink/60">Prices in Australian dollars</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_HOMES.map((h, i) => (
            <article key={h.id} className={`surface overflow-hidden rise rise-${i + 1}`}>
              <div className={`aspect-[5/3] bg-gradient-to-br ${h.bg} relative`}>
                <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <g fill="none" stroke="#1F2421" strokeWidth="1.5" opacity="0.6">
                    <path d="M30 95 L30 60 L100 25 L170 60 L170 95 Z" fill="#FBF7F0" />
                    <rect x="75" y="65" width="22" height="30" fill="#2C5545" />
                    <rect x="110" y="60" width="18" height="18" fill="#CFE0E3" />
                    <rect x="140" y="60" width="18" height="18" fill="#CFE0E3" />
                    <path d="M0 95 L200 95" />
                  </g>
                </svg>
                <div className="absolute top-3 left-3">
                  <Pill tone="forest">{h.sharesLeft} slices left</Pill>
                </div>
              </div>
              <div className="p-5">
                <h3 className="h-card">{h.title}</h3>
                <p className="body-sm text-ink/65 mt-1">{h.suburb}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 mb-5">
                  <div>
                    <p className="text-xs text-ink/55">Price per slice</p>
                    <p className="font-display text-2xl font-semibold">{h.price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/55">Yearly rent</p>
                    <p className="font-display text-2xl font-semibold text-forest">{h.yieldPct}</p>
                  </div>
                </div>
                <a href="#buy-flow" className="block text-center bg-forest hover:bg-forest-dark text-cream rounded-pill px-5 py-3 font-semibold text-sm min-h-[48px] flex items-center justify-center transition-colors">
                  Buy a slice →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuyFlow() {
  const { signer, address } = useWallet();
  const [propertyId, setPropertyId] = useState("1");
  const [listingId, setListingId] = useState("1");
  const [amount, setAmount] = useState("10");
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function topUp() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const usdc = getUSDC(signer);
      const tx = await usdc.mint(await signer.getAddress(), 10_000n * 1_000_000n);
      await tx.wait();
      setStatus({ kind: "ok", msg: "Added $10,000 in test money to your account." });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const exchange = getExchange(signer);
      const usdc = getUSDC(signer);
      const listing = await exchange.listings(listingId);
      if (!listing.active) throw new Error("That listing isn't active right now.");
      const total = BigInt(amount) * listing.pricePerShare;

      setStatus({ kind: "info", msg: "Approving the payment…" });
      await (await usdc.approve(ADDRESSES.FractionalExchange, total)).wait();

      setStatus({ kind: "info", msg: "Buying your slices…" });
      await (await exchange.buy(listingId, amount)).wait();

      setStatus({
        kind: "ok",
        msg: `Done. You bought ${amount} slices for $${formatUnits(total, 6)}.`
      });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="buy-flow" className="bg-bone scroll-mt-24">
      <div className="wrap py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Eyebrow>Buying a slice</Eyebrow>
            <h2 className="h-section mt-2">It only takes a minute.</h2>
            <ol className="mt-6 space-y-3 body-sm text-ink/75 list-decimal pl-5">
              <li>Top up your account with some money.</li>
              <li>Choose the listing you want and how many slices.</li>
              <li>We’ll show you the total, you confirm, and that’s it.</li>
            </ol>
            <p className="body-sm text-ink/60 mt-5">
              For the demo, money is “test dollars”. In a real launch this would
              be real Australian dollars connected to your bank.
            </p>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <Field label="1. Top up your account" hint="Add test money so you can buy something">
                <Button onClick={topUp} disabled={busy || !address} full>
                  Add $10,000 (test money)
                </Button>
              </Field>

              <Field label="2. Which listing?" hint="Each listing is a batch of slices someone is selling. Use 1 for the demo.">
                <Input value={listingId} onChange={(e) => setListingId(e.target.value)} inputMode="numeric" />
              </Field>

              <Field label="3. How many slices?">
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
              </Field>

              <Button onClick={buy} disabled={busy || !address} full tone="secondary">
                {busy ? "Working…" : "Buy slices"}
              </Button>

              {!address ? (
                <p className="text-sm text-ink/60 mt-3 text-center">Sign in at the top to get started.</p>
              ) : null}

              {status ? (
                <div className="mt-4">
                  <Notice kind={status.kind}>{status.msg}</Notice>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function YourSlices() {
  const { provider, address } = useWallet();
  const [rows, setRows] = useState<{ id: string; balance: string; total: string }[]>([]);
  const [usdcBal, setUsdcBal] = useState<string>("0");

  useEffect(() => {
    (async () => {
      if (!provider || !address) return;
      try {
        const exchange = getExchange(provider);
        const usdc = getUSDC(provider);
        setUsdcBal(formatUnits(await usdc.balanceOf(address), 6));

        const out: { id: string; balance: string; total: string }[] = [];
        for (let id = 1; id <= 20; id++) {
          try {
            const b = await exchange.balanceOfShares(id, address);
            if (b > 0n) {
              const t = await exchange.totalShares(id);
              out.push({ id: String(id), balance: b.toString(), total: t.toString() });
            }
          } catch {}
        }
        setRows(out);
      } catch {}
    })();
  }, [provider, address]);

  const [claimPid, setClaimPid] = useState("1");
  const [claimEpoch, setClaimEpoch] = useState("0");
  const { signer } = useWallet();
  const [cstatus, setCstatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function claim() {
    if (!signer) return setCstatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const exchange = getExchange(signer);
      const tx = await exchange.claimDividend(claimPid, claimEpoch);
      const rec = await tx.wait();
      const log = rec.logs.find((l: any) => l.fragment?.name === "DividendClaimed");
      const amt = log ? formatUnits(log.args.amount, 6) : "?";
      setCstatus({ kind: "ok", msg: `Great. You received $${amt} in rent.` });
    } catch (e: any) {
      setCstatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>Your account</Eyebrow>
        <h2 className="h-section mt-2 mb-6">What you own.</h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-xs text-ink/55 uppercase tracking-wide font-semibold">Your money</p>
            <p className="font-display text-3xl font-semibold mt-1">${usdcBal}</p>
            <p className="text-xs text-ink/55 mt-1">test dollars</p>
          </Card>
          <Card>
            <p className="text-xs text-ink/55 uppercase tracking-wide font-semibold">Homes you’re in</p>
            <p className="font-display text-3xl font-semibold mt-1">{rows.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-ink/55 uppercase tracking-wide font-semibold">Total slices</p>
            <p className="font-display text-3xl font-semibold mt-1">
              {rows.reduce((acc, r) => acc + Number(r.balance), 0)}
            </p>
          </Card>
        </div>

        {rows.length === 0 ? (
          <Card>
            <p className="body-sm text-ink/65">
              You don’t own any slices yet. Buy one above to get started.
            </p>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-ink/10">
                  <th className="py-3 pr-4 font-semibold text-ink/55 text-xs uppercase tracking-wide">Home</th>
                  <th className="py-3 pr-4 font-semibold text-ink/55 text-xs uppercase tracking-wide">Your slices</th>
                  <th className="py-3 pr-4 font-semibold text-ink/55 text-xs uppercase tracking-wide">Of total</th>
                  <th className="py-3 font-semibold text-ink/55 text-xs uppercase tracking-wide">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-ink/5">
                    <td className="py-4 pr-4 font-semibold">Home #{r.id}</td>
                    <td className="py-4 pr-4">{r.balance}</td>
                    <td className="py-4 pr-4 text-ink/60">{r.total}</td>
                    <td className="py-4 font-display text-lg text-terracotta">
                      {((Number(r.balance) / Number(r.total)) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div className="mt-8">
          <Card>
            <h3 className="h-card mb-3">Collect rent</h3>
            <p className="body-sm text-ink/70 mb-5">
              When the property manager has put rent on a home you own a slice of, claim it here.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 sm:items-end">
              <Field label="Home number">
                <Input value={claimPid} onChange={(e) => setClaimPid(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Round" hint="The first rent payment is round 0">
                <Input value={claimEpoch} onChange={(e) => setClaimEpoch(e.target.value)} inputMode="numeric" />
              </Field>
              <div className="pb-5">
                <Button onClick={claim} disabled={busy || !address} full>
                  {busy ? "Working…" : "Collect rent"}
                </Button>
              </div>
            </div>
            {cstatus ? <div className="mt-2"><Notice kind={cstatus.kind}>{cstatus.msg}</Notice></div> : null}
          </Card>
        </div>

        <p className="mt-8 text-center">
          <Link href="/" className="text-forest hover:text-terracotta font-semibold underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
