"use client";

import { useState } from "react";
import { keccak256, toUtf8Bytes } from "ethers";
import Link from "next/link";
import Frame from "@/components/Frame";
import { Button, Card, Eyebrow, Field, Input, Notice } from "@/components/ui";
import { WalletProvider, useWallet } from "@/lib/wallet";
import { getRegistry, getCompliance } from "@/lib/contracts";

export default function Page() {
  return (
    <Frame>
      <VerifyPage />
    </Frame>
  );
}

function VerifyPage() {
  return (
    <>
      <Header />
      <CheckHome />
      <ListHome />
      <CheckPerson />
    </>
  );
}

function Header() {
  return (
    <section className="grain bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>For inspectors & regulators</Eyebrow>
        <h1 className="h-display mt-3 max-w-4xl">
          Sign off a home or a person.
        </h1>
        <p className="body-lg text-ink/75 mt-5 max-w-2xl">
          Inspectors check homes before they go on the marketplace.
          Regulators check that buyers and sellers are who they say they are.
        </p>
      </div>
    </section>
  );
}

function CheckHome() {
  const { signer, address } = useWallet();
  const [deed, setDeed] = useState("");
  const [survey, setSurvey] = useState("");
  const [structural, setStructural] = useState("");
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string; verificationId?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    if (!deed || !survey || !structural) {
      return setStatus({ kind: "err", msg: "Please fill all three boxes before signing off." });
    }
    setBusy(true);
    try {
      const r = getRegistry(signer);
      const tx = await r.fileVerification(
        keccak256(toUtf8Bytes(deed)),
        keccak256(toUtf8Bytes(survey)),
        keccak256(toUtf8Bytes(structural))
      );
      const rec = await tx.wait();
      const log = rec.logs.find((l: any) => l.fragment?.name === "VerificationFiled");
      const id = log?.args?.verificationId;
      setStatus({
        kind: "ok",
        msg: "Sign-off recorded. The home can now be listed. Keep this reference code; you'll need it in the next step.",
        verificationId: id
      });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-bone">
      <div className="wrap py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Eyebrow>Step 1 (for inspectors)</Eyebrow>
            <h2 className="h-section mt-2">Sign off a home.</h2>
            <p className="body-lg text-ink/75 mt-3">
              Once you’ve inspected the home and checked the paperwork,
              record what you saw here. Your signature gets locked into the record
              forever, so nobody can change it later.
            </p>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <Field label="Title deed reference" hint="A short note about the deed: address, file number, anything you’d write on a sticky">
                <Input value={deed} onChange={(e) => setDeed(e.target.value)} placeholder="e.g. Deed for 42 Baker Street, file 8821" />
              </Field>
              <Field label="Survey reference" hint="What the surveyor confirmed">
                <Input value={survey} onChange={(e) => setSurvey(e.target.value)} placeholder="e.g. Surveyed 12 Mar 2026, no boundary issues" />
              </Field>
              <Field label="Building/structural check" hint="The structural report">
                <Input value={structural} onChange={(e) => setStructural(e.target.value)} placeholder="e.g. Sound, no major repairs needed" />
              </Field>
              <Button onClick={submit} disabled={busy || !address} full>
                {busy ? "Signing off…" : "Sign off this home"}
              </Button>
              {status ? (
                <div className="mt-4">
                  <Notice kind={status.kind} title={status.kind === "ok" ? "Sign-off recorded" : undefined}>
                    {status.msg}
                    {status.verificationId ? (
                      <span className="block mt-2 break-all font-mono text-xs bg-cream/60 p-2 rounded">{status.verificationId}</span>
                    ) : null}
                  </Notice>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function ListHome() {
  const { signer, address } = useWallet();
  const [to, setTo] = useState("");
  const [vid, setVid] = useState("");
  const [deedURI, setDeedURI] = useState("ipfs://");
  const [surveyURI, setSurveyURI] = useState("ipfs://");
  const [structURI, setStructURI] = useState("ipfs://");
  const [status, setStatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!signer) return setStatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const r = getRegistry(signer);
      const tx = await r.mintProperty(to, vid, deedURI, surveyURI, structURI);
      const rec = await tx.wait();
      const log = rec.logs.find((l: any) => l.fragment?.name === "PropertyMinted");
      const id = log?.args?.propertyId?.toString() ?? "?";
      setStatus({ kind: "ok", msg: `Home registered as #${id}. The owner can now split it into slices.` });
    } catch (e: any) {
      setStatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Eyebrow>Step 2 (for inspectors)</Eyebrow>
            <h2 className="h-section mt-2">Add the home to the marketplace.</h2>
            <p className="body-lg text-ink/75 mt-3">
              Once you’ve signed off (Step 1), enter the owner’s account address
              and the sign-off code, plus links to the actual documents.
            </p>
          </div>
          <div className="lg:col-span-7">
            <Card>
              <Field label="Owner’s account address" hint="Looks like 0x followed by letters and numbers">
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" />
              </Field>
              <Field label="Sign-off code" hint="From Step 1, starts with 0x">
                <Input value={vid} onChange={(e) => setVid(e.target.value)} placeholder="0x…" />
              </Field>
              <Field label="Where the deed is stored online">
                <Input value={deedURI} onChange={(e) => setDeedURI(e.target.value)} />
              </Field>
              <Field label="Where the survey is stored online">
                <Input value={surveyURI} onChange={(e) => setSurveyURI(e.target.value)} />
              </Field>
              <Field label="Where the structural report is stored online">
                <Input value={structURI} onChange={(e) => setStructURI(e.target.value)} />
              </Field>
              <Button onClick={submit} disabled={busy || !address} full tone="secondary">
                {busy ? "Registering…" : "Register the home"}
              </Button>
              {status ? <div className="mt-4"><Notice kind={status.kind}>{status.msg}</Notice></div> : null}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckPerson() {
  const { signer, provider, address } = useWallet();
  const [user, setUser] = useState("");
  const [jurisdiction, setJurisdiction] = useState("36");
  const [validity, setValidity] = useState("31536000");
  const [vstatus, setVstatus] = useState<{ kind: "info" | "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [checkUser, setCheckUser] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);

  async function verify() {
    if (!signer) return setVstatus({ kind: "err", msg: "Please sign in first." });
    setBusy(true);
    try {
      const c = getCompliance(signer);
      const proof = keccak256(toUtf8Bytes(`zkp:${user}:${Date.now()}`));
      const tx = await c.verifyIdentity(user, Number(jurisdiction), proof, BigInt(validity));
      await tx.wait();
      setVstatus({ kind: "ok", msg: "Person verified. They can now buy and sell on the marketplace." });
    } catch (e: any) {
      setVstatus({ kind: "err", msg: e.shortMessage || e.message });
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (!provider) return;
    try {
      const c = getCompliance(provider);
      const ok = await c.isCompliant(checkUser);
      setCheckResult(ok ? "✓ This person is verified and can trade." : "✗ This person is not verified yet.");
    } catch (e: any) {
      setCheckResult(`Couldn't check: ${e.shortMessage || e.message}`);
    }
  }

  return (
    <section className="bg-bone">
      <div className="wrap py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Eyebrow>For regulators</Eyebrow>
            <h2 className="h-section mt-2">Sign off a person.</h2>
            <p className="body-lg text-ink/75 mt-3">
              Before someone can buy or sell on the marketplace, you need to confirm
              they’ve passed identity checks. This sticks for a year.
            </p>
          </div>
          <div className="lg:col-span-7 space-y-5">
            <Card>
              <h3 className="h-card mb-4">Verify someone</h3>
              <Field label="Their account address">
                <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="0x…" />
              </Field>
              <Field label="Country code" hint="36 = Australia">
                <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="How long is this verification valid (seconds)" hint="31,536,000 is one year">
                <Input value={validity} onChange={(e) => setValidity(e.target.value)} inputMode="numeric" />
              </Field>
              <Button onClick={verify} disabled={busy || !address} full>
                {busy ? "Working…" : "Verify this person"}
              </Button>
              {vstatus ? <div className="mt-4"><Notice kind={vstatus.kind}>{vstatus.msg}</Notice></div> : null}
            </Card>

            <Card>
              <h3 className="h-card mb-4">Check someone’s status</h3>
              <Field label="Their account address">
                <Input value={checkUser} onChange={(e) => setCheckUser(e.target.value)} placeholder="0x…" />
              </Field>
              <Button onClick={check} tone="ghost" full>
                Check status
              </Button>
              {checkResult ? <div className="mt-4"><Notice kind={checkResult.startsWith("✓") ? "ok" : "err"}>{checkResult}</Notice></div> : null}
            </Card>
          </div>
        </div>

        <p className="mt-12 text-center">
          <Link href="/" className="text-forest hover:text-terracotta font-semibold underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
