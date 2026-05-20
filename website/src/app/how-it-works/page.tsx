"use client";

import Link from "next/link";
import Frame from "@/components/Frame";
import { Card, Eyebrow } from "@/components/ui";

export default function Page() {
  return (
    <Frame>
      <Header />
      <Walkthrough />
      <Glossary />
      <CTA />
    </Frame>
  );
}

function Header() {
  return (
    <section className="grain bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>How LedgerNode works</Eyebrow>
        <h1 className="h-display mt-3 max-w-4xl">
          A home, <span className="text-terracotta italic">but shared</span>.
        </h1>
        <p className="body-lg text-ink/75 mt-5 max-w-2xl">
          Imagine a pizza. One whole pizza is expensive. Cut into slices,
          everyone can have a piece. That’s what LedgerNode does with homes.
        </p>
      </div>
    </section>
  );
}

function Walkthrough() {
  const steps = [
    {
      n: "1",
      t: "Someone owns a home",
      d: "It might be them, it might be a property developer. Either way, they have a real home with real paperwork."
    },
    {
      n: "2",
      t: "An inspector checks everything",
      d: "Someone qualified walks through the home, looks at the deed, the survey, and the structural report. They sign off online so it’s permanent."
    },
    {
      n: "3",
      t: "The home is split into slices",
      d: "Usually 10,000 slices. The owner can keep some and sell some, or sell them all."
    },
    {
      n: "4",
      t: "Buyers grab the slices",
      d: "Anyone who’s been verified can buy. Pay the price per slice, get a slice (or 100, or 1,000)."
    },
    {
      n: "5",
      t: "Tenants pay rent like normal",
      d: "Someone lives in the home and pays rent. The property manager collects it."
    },
    {
      n: "6",
      t: "Rent gets shared automatically",
      d: "The system splits the rent based on who owns which slices, and pays everyone in one go. No paperwork, no waiting."
    },
    {
      n: "7",
      t: "Sell whenever you want",
      d: "Want out? List your slices. When someone buys them, you get the money in your account, normally within seconds."
    }
  ];

  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>Step by step</Eyebrow>
        <h2 className="h-section mt-2 mb-8">The whole story.</h2>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={s.n} className={`surface p-6 sm:p-7 rise rise-${(i % 5) + 1} flex flex-col sm:flex-row gap-4 sm:gap-6`}>
              <span className="font-display text-5xl sm:text-6xl font-semibold text-terracotta leading-none">{s.n}</span>
              <div>
                <h3 className="h-card mb-1.5">{s.t}</h3>
                <p className="body-sm text-ink/70" dangerouslySetInnerHTML={{ __html: s.d }} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Glossary() {
  const terms = [
    { word: "Slice", meaning: "A small piece of a home. Like a share in a company, but for property." },
    { word: "Inspector", meaning: "An independent person who checks the home is real, sound, and properly owned." },
    { word: "Listing", meaning: "An offer to sell some slices at a specific price. Like an eBay listing, but for property slices." },
    { word: "Verified", meaning: "Someone whose ID has been checked, so we know they’re a real person." },
    { word: "Test dollars", meaning: "Fake money used in the demo. In a real launch, you’d use real Australian dollars." }
  ];
  return (
    <section className="bg-bone">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>Words to know</Eyebrow>
        <h2 className="h-section mt-2 mb-8">Plain English glossary.</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          {terms.map((t) => (
            <Card key={t.word}>
              <dt className="font-display text-xl font-semibold text-forest mb-2">{t.word}</dt>
              <dd className="body-sm text-ink/75" dangerouslySetInnerHTML={{ __html: t.meaning }} />
            </Card>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16 text-center">
        <h2 className="h-section">Ready to try?</h2>
        <p className="body-lg text-ink/70 mt-3">Start with a home that catches your eye.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/buy"
            className="bg-forest text-cream hover:bg-forest-dark rounded-pill px-7 py-4 font-semibold min-h-[52px] inline-flex items-center justify-center transition-colors"
          >
            Browse homes
          </Link>
          <Link
            href="/"
            className="border border-ink/20 hover:border-forest hover:text-forest rounded-pill px-7 py-4 font-semibold min-h-[52px] inline-flex items-center justify-center transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
