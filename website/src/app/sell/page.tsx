"use client";

import { useState } from "react";
import Link from "next/link";
import Frame from "@/components/Frame";
import { Button, Card, Eyebrow, Field, Input, Notice } from "@/components/ui";
import { WalletProvider, useWallet } from "@/lib/wallet";
import { getRegistry, getExchange, ADDRESSES } from "@/lib/contracts";

export default function Page() {
  return (
    <Frame>
      <SellPage />
    </Frame>
  );
}

function SellPage() {
  return (
    <>
      <Header />
      <Steps />
      <Actions />
      <SellSlices />
      <DistributeRent />
    </>
  );
}

function Header() {
  return (
    <section className="grain bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>For homeowners</Eyebrow>
        <h1 className="h-display mt-3 max-w-4xl">
          Sell <span className="text-terracotta italic">just a slice</span> of your home.
        </h1>
        <p className="body-lg text-ink/75 mt-5 max-w-2xl">
          Need cash but don’t want to lose your home? Sell 10%, 20%, or any
          percentage of your property. You keep living there. You keep the keys.
          Your new co-owners just earn a share of the rent.
        </p>
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    { n: "1", t: "Approve us", d: "Give us permission to look after your home’s record." },
    { n: "2", t: "Split it up", d: "Choose how many slices your home becomes. Most pick 10,000." },
    { n: "3", t: "List slices for sale", d: "Decide how many to sell, and at what price." },
    { n: "4", t: "Share the rent", d: "When rent comes in, share it with the people who bought slices." }
  ];
  return (
    <section className="bg-bone">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>What you’ll do</Eyebrow>
        <h2 className="h-section mt-2 mb-8">Four small steps.</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <li key={s.n} className={`surface p-6 rise rise-${i + 1}`}>
              <span className="font-display text-5xl font-semibold text-terracotta block leading-none mb-3">{s.n}</span>
              <h3 className="h-card mb-1.5">{s.t}</h3>
              <p className="body-sm text-ink/70" dangerouslySetInnerHTML={{ __html: s.d }} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Actions() {
  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-5">
          <ApproveCard />
          <FractionaliseCard />
        </div>
      </div>
    </section>
  );
}

function ApproveCard() {
  const { signer, address } = useWallet();
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function approve() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const r = getRegistry(signer);
      const tx = await r.setApprovalForAll(ADDRESSES.FractionalExchange, true);
      await tx.wait();
      setStatus({ kind: "ok", msg: "Done. You can now split your home into slices." });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Eyebrow>Step 1</Eyebrow>
      <h3 className="h-card mt-2 mb-3">Give us permission</h3>
      <p className="body-sm text-ink/70 mb-5">
        Before we can split your home into shares, we need your okay to handle the paperwork.
        One tap, and you can split as many homes as you want later.
      </p>
      <Button onClick={approve} disabled={busy || !address} full>
        {busy ? "Working…" : "Give permission"}
      </Button>
      {status ? <div className="mt-4"><Notice kind={status.kind}>{status.msg}</Notice></div> : null}
    </Card>
  );
}

function FractionaliseCard() {
  const { signer, address } = useWallet();
  const [propertyId, setPropertyId] = useState("1");
  const [supply, setSupply] = useState("10000");
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const e = getExchange(signer);
      const tx = await e.fractionalise(propertyId, supply);
      await tx.wait();
      setStatus({
        kind: "ok",
        msg: `Done. Your home is now ${supply} slices. You hold all of them until you sell some.`
      });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Eyebrow>Step 2</Eyebrow>
      <h3 className="h-card mt-2 mb-3">Split your home into slices</h3>
      <Field label="Which home?" hint="If this is your first, it’s number 1">
        <Input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} inputMode="numeric" />
      </Field>
      <Field label="How many slices?" hint="10,000 is a good round number">
        <Input value={supply} onChange={(e) => setSupply(e.target.value)} inputMode="numeric" />
      </Field>
      <Button onClick={submit} disabled={busy || !address} full tone="secondary">
        {busy ? "Working…" : "Split into slices"}
      </Button>
      {status ? <div className="mt-4"><Notice kind={status.kind}>{status.msg}</Notice></div> : null}
    </Card>
  );
}

function SellSlices() {
  const { signer, address } = useWallet();
  const [propertyId, setPropertyId] = useState("1");
  const [amount, setAmount] = useState("1000");
  const [price, setPrice] = useState("100");
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const exchange = getExchange(signer);
      const tx = await exchange.list(propertyId, amount, BigInt(price) * 1_000_000n);
      const rec = await tx.wait();
      const log = rec.logs.find((l: any) => l.fragment?.name === "Listed");
      const id = log?.args?.listingId?.toString() ?? "?";
      setStatus({
        kind: "ok",
        msg: `Listing #${id} is live. Buyers can purchase ${amount} slices at $${price} each.`
      });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-forest text-cream">
      <div className="wrap py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <span className="eyebrow text-butter">Step 3</span>
            <h2 className="h-section mt-2">List slices for sale.</h2>
            <p className="body-lg text-cream/85 mt-3">
              Choose how many slices to sell and the price per slice.
              When a buyer takes them, the money comes straight to you.
            </p>
            <p className="body-sm text-cream/65 mt-4">
              You can list any amount, any time. Keep the rest, or list more later.
            </p>
          </div>

          <div className="lg:col-span-7 bg-cream text-ink rounded-soft p-6 sm:p-8 shadow-lift">
            <Field label="Which home?">
              <Input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="How many slices to sell?">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Price per slice (in dollars)">
              <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </Field>
            <Button onClick={submit} disabled={busy || !address} full tone="secondary">
              {busy ? "Working…" : "List for sale"}
            </Button>
            {status ? <div className="mt-4"><Notice kind={status.kind}>{status.msg}</Notice></div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DistributeRent() {
  const { signer, address } = useWallet();
  const [propertyId, setPropertyId] = useState("1");
  const [amountUSDC, setAmountUSDC] = useState("1000");
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const { getUSDC } = await import("@/lib/contracts");
      const usdc = getUSDC(signer);
      const exchange = getExchange(signer);
      const baseUnits = BigInt(amountUSDC) * 1_000_000n;

      setStatus({ kind: "info", msg: "Topping up your account with rent money…" });
      await (await usdc.mint(await signer.getAddress(), baseUnits)).wait();

      setStatus({ kind: "info", msg: "Approving the rent payment…" });
      await (await usdc.approve(ADDRESSES.FractionalExchange, baseUnits)).wait();

      setStatus({ kind: "info", msg: "Sharing the rent with slice owners…" });
      await (await exchange.automatedDividend(propertyId, baseUnits)).wait();

      setStatus({
        kind: "ok",
        msg: `$${amountUSDC} has been shared out. Everyone with a slice can now collect their share.`
      });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Card>
          <Eyebrow>Step 4</Eyebrow>
          <h2 className="h-section mt-2 mb-3">Share the rent</h2>
          <p className="body-sm text-ink/70 mb-6 max-w-2xl">
            Each month, when the tenants pay rent, share it out automatically.
            Everyone who owns a slice will get their share based on how many slices they hold.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 sm:items-end">
            <Field label="Which home?">
              <Input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Rent collected ($)">
              <Input value={amountUSDC} onChange={(e) => setAmountUSDC(e.target.value)} inputMode="numeric" />
            </Field>
            <div className="pb-5">
              <Button onClick={submit} disabled={busy || !address} full>
                {busy ? "Working…" : "Share rent"}
              </Button>
            </div>
          </div>
          {status ? <div className="mt-3"><Notice kind={status.kind}>{status.msg}</Notice></div> : null}
        </Card>

        <p className="mt-8 text-center">
          <Link href="/" className="text-forest hover:text-terracotta font-semibold underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
