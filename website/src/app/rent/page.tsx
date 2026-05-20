"use client";

import Link from "next/link";
import Frame from "@/components/Frame";
import { Card, Eyebrow } from "@/components/ui";

export default function Page() {
  return (
    <Frame>
      <Header />
      <Why />
      <Browse />
      <CTA />
    </Frame>
  );
}

function Header() {
  return (
    <section className="grain bg-cream">
      <div className="wrap py-12 sm:py-16">
        <Eyebrow>For renters</Eyebrow>
        <h1 className="h-display mt-3 max-w-4xl">
          Renting, <span className="text-terracotta italic">honestly</span>.
        </h1>
        <p className="body-lg text-ink/75 mt-5 max-w-2xl">
          Every home on LedgerNode has been checked, inspected, and signed off.
          The conditions are public, the records are permanent, and your bond is held in a place
          where no one can touch it without both of you agreeing.
        </p>
      </div>
    </section>
  );
}

function Why() {
  const items = [
    { t: "What you see is what you get", b: "The inspection report is right there. No surprises after you move in." },
    { t: "Your bond is safe", b: "Held in a public, locked account. Released when both you and the owner agree." },
    { t: "Rent goes where it should", b: "Your rent is shared automatically with the home’s slice owners. No middleman skimming." },
    { t: "Reviews stay honest", b: "Reviews are linked to real signed leases. Nobody can fake a five-star rating." }
  ];
  return (
    <section className="bg-bone">
      <div className="wrap py-12 sm:py-16">
        <div className="max-w-2xl mb-8">
          <Eyebrow>Why rent here</Eyebrow>
          <h2 className="h-section mt-2">A fair deal for both sides.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((i, idx) => (
            <div key={i.t} className={`surface p-6 rise rise-${idx + 1}`}>
              <div className="w-10 h-10 rounded-full bg-sky flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C5545" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold mb-1.5" dangerouslySetInnerHTML={{ __html: i.t }} />
              <p className="body-sm text-ink/70" dangerouslySetInnerHTML={{ __html: i.b }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Browse() {
  const samples = [
    { title: "42 Baker Street", suburb: "New Farm, QLD", price: "$620/wk", beds: "3 bed, 2 bath", bg: "from-butter via-terracotta-soft to-sky" },
    { title: "12 Coral Lane", suburb: "West End, QLD", price: "$540/wk", beds: "2 bed, 1 bath", bg: "from-sky via-butter to-terracotta-soft" },
    { title: "8 Henderson Place", suburb: "Paddington, QLD", price: "$715/wk", beds: "3 bed, 2 bath", bg: "from-terracotta-soft via-butter to-sky" }
  ];
  return (
    <section className="bg-cream">
      <div className="wrap py-12 sm:py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <Eyebrow>Listings</Eyebrow>
            <h2 className="h-section mt-2">Homes for rent</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {samples.map((s, i) => (
            <article key={s.title} className={`surface overflow-hidden rise rise-${i + 1}`}>
              <div className={`aspect-[5/3] bg-gradient-to-br ${s.bg} relative`}>
                <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <g fill="none" stroke="#1F2421" strokeWidth="1.5" opacity="0.6">
                    <path d="M30 95 L30 60 L100 25 L170 60 L170 95 Z" fill="#FBF7F0" />
                    <rect x="75" y="65" width="22" height="30" fill="#2C5545" />
                    <rect x="110" y="60" width="18" height="18" fill="#CFE0E3" />
                    <rect x="140" y="60" width="18" height="18" fill="#CFE0E3" />
                    <path d="M0 95 L200 95" />
                  </g>
                </svg>
              </div>
              <div className="p-5">
                <h3 className="h-card">{s.title}</h3>
                <p className="body-sm text-ink/65 mt-1">{s.suburb}</p>
                <div className="flex items-baseline justify-between mt-4">
                  <span className="font-display text-2xl font-semibold text-forest">{s.price}</span>
                  <span className="text-sm text-ink/60">{s.beds}</span>
                </div>
                <button className="mt-4 w-full bg-bone hover:bg-butter rounded-pill px-5 py-3 text-sm font-semibold min-h-[48px] transition-colors">
                  Express interest
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="text-center text-sm text-ink/55 mt-8">
          These are example listings while the rental side is being built.
        </p>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-bone">
      <div className="wrap py-12 sm:py-16 text-center">
        <h2 className="h-section">Looking to rent? Stay in touch.</h2>
        <p className="body-lg text-ink/70 mt-3 max-w-xl mx-auto">
          The rental side opens later this year. For now, browse the homes you could buy a slice of.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/buy"
            className="bg-forest text-cream hover:bg-forest-dark rounded-pill px-6 py-4 font-semibold min-h-[52px] inline-flex items-center justify-center transition-colors"
          >
            Browse homes to buy into
          </Link>
          <Link
            href="/"
            className="border border-ink/20 hover:border-forest hover:text-forest rounded-pill px-6 py-4 font-semibold min-h-[52px] inline-flex items-center justify-center transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
