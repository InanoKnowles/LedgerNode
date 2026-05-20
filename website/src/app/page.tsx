"use client";

import Link from "next/link";
import { useState } from "react";
import Frame from "@/components/Frame";
import { useWallet } from "@/lib/wallet";

export default function Home() {
  return (
    <Frame>
      <Hero />
      <RoleChooser />
      <HowItWorks />
      <SampleProperty />
      <Reassurance />
      <FAQ />
      <CTA />
    </Frame>
  );
}

function Hero() {
  const { name, address } = useWallet();
  const greeting = name
    ? `Welcome back, ${name.split(" ")[0]}`
    : address
    ? "Welcome back"
    : "A friendlier way to own a home";

  return (
    <section className="grain bg-cream">
      <div className="wrap py-12 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-8 rise rise-1">
            <p className="eyebrow mb-4">{greeting}</p>
            <h1 className="h-display">
              Own a piece of a home.<br />
              Even just a <span className="text-terracotta italic">tiny</span> piece.
            </h1>
            <p className="body-lg text-ink/75 mt-6 max-w-2xl">
              You don’t need a deposit, a mortgage, or perfect credit.
              Share in a real home from as little as a hundred dollars, and get a slice
              of the rent every month. Or sell part of your own home, without losing your keys.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/buy"
                className="bg-forest text-cream hover:bg-forest-dark rounded-pill px-6 py-4 font-semibold text-base inline-flex items-center justify-center gap-2 min-h-[52px] transition-colors"
              >
                Browse homes →
              </Link>
              <Link
                href="/how-it-works"
                className="border border-ink/20 hover:border-forest hover:text-forest rounded-pill px-6 py-4 font-semibold text-base inline-flex items-center justify-center min-h-[52px] transition-colors"
              >
                How does it work?
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 rise rise-3">
            <div className="surface p-6 sm:p-7">
              <p className="eyebrow mb-3">Featured this week</p>
              <div className="aspect-[4/3] rounded-soft bg-gradient-to-br from-butter via-terracotta-soft to-sky mb-4 relative overflow-hidden">
                <svg viewBox="0 0 200 150" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <g fill="none" stroke="#1F2421" strokeWidth="1.5" opacity="0.55">
                    <path d="M40 110 L40 70 L100 30 L160 70 L160 110 Z" fill="#FBF7F0" />
                    <path d="M40 70 L100 30 L160 70" />
                    <rect x="70" y="80" width="20" height="30" fill="#2C5545" />
                    <rect x="110" y="75" width="18" height="18" fill="#CFE0E3" />
                    <rect x="135" y="75" width="18" height="18" fill="#CFE0E3" />
                    <path d="M0 110 L200 110" />
                    <circle cx="30" cy="40" r="8" fill="#F5E6B8" stroke="none" />
                  </g>
                </svg>
              </div>
              <p className="h-card">42 Baker Street, New Farm</p>
              <p className="body-sm text-ink/65 mt-1">Brisbane, QLD</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-ink/55 text-xs">From</p>
                  <p className="font-semibold text-base">$100</p>
                </div>
                <div>
                  <p className="text-ink/55 text-xs">Yearly rent</p>
                  <p className="font-semibold text-base text-forest">6.2%</p>
                </div>
                <div>
                  <p className="text-ink/55 text-xs">Shares left</p>
                  <p className="font-semibold text-base">3,847</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleChooser() {
  const roles = [
    {
      href: "/buy",
      title: "I want to buy in",
      sub: "Own a slice of a home, earn rent",
      tone: "bg-terracotta-soft text-ink",
      emoji: "🏠"
    },
    {
      href: "/sell",
      title: "I want to sell a slice",
      sub: "Free up cash, keep your home",
      tone: "bg-butter text-ink",
      emoji: "🔑"
    },
    {
      href: "/rent",
      title: "I want to rent",
      sub: "Find a place that’s honestly listed",
      tone: "bg-sky text-ink",
      emoji: "🛏️"
    },
    {
      href: "/verify",
      title: "I’m an inspector",
      sub: "Verify a home for the marketplace",
      tone: "bg-forest text-cream",
      emoji: "✓"
    }
  ];

  return (
    <section className="bg-bone">
      <div className="wrap py-14 sm:py-20">
        <div className="max-w-2xl mb-8 sm:mb-12">
          <p className="eyebrow mb-3">Where to start</p>
          <h2 className="h-section">Tell us who you are.</h2>
          <p className="body-lg text-ink/70 mt-3">
            We’ll show you exactly what you need, nothing else. No filler. No fine print.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {roles.map((r, i) => (
            <Link
              key={r.href}
              href={r.href}
              className={`${r.tone} rounded-soft p-6 sm:p-7 min-h-[180px] flex flex-col rise rise-${i + 1} hover:shadow-lift transition-shadow`}
            >
              <span className="text-3xl sm:text-4xl mb-3" aria-hidden>{r.emoji}</span>
              <h3 className="h-card mb-2">{r.title}</h3>
              <p className="body-sm opacity-80" dangerouslySetInnerHTML={{ __html: r.sub }} />
              <span className="mt-auto pt-4 font-semibold text-sm">Start here →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "We check the home",
      body: "An inspector visits the property, checks the paperwork, and signs off. Like a building and pest report, but online and permanent."
    },
    {
      n: "2",
      title: "The home is split into shares",
      body: "Think of a pie cut into 10,000 slices. The owner keeps as many as they want, the rest go on the marketplace."
    },
    {
      n: "3",
      title: "You buy slices",
      body: "Pick the home you like. Buy one slice or a hundred. You see exactly how much rent you’ll earn each year."
    },
    {
      n: "4",
      title: "Rent shows up automatically",
      body: "When the tenants pay rent, the system shares it out to everyone who owns a slice. No chasing, no spreadsheets."
    }
  ];
  return (
    <section className="bg-cream">
      <div className="wrap py-14 sm:py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="h-section">Simpler than buying a coffee.</h2>
            <p className="body-lg text-ink/70 mt-4">
              You don’t need to understand the technology. You just need to know
              that everything is checked, every transaction is recorded, and nobody can change
              the numbers behind your back.
            </p>
          </div>

          <ol className="lg:col-span-8 space-y-4 sm:space-y-5">
            {steps.map((s, i) => (
              <li key={s.n} className={`surface p-5 sm:p-7 rise rise-${i + 1} flex gap-4 sm:gap-6`}>
                <span className="font-display text-4xl sm:text-5xl font-semibold text-terracotta leading-none">{s.n}</span>
                <div>
                  <h3 className="h-card mb-1.5">{s.title}</h3>
                  <p className="body-sm text-ink/70" dangerouslySetInnerHTML={{ __html: s.body }} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function SampleProperty() {
  return (
    <section className="bg-forest text-cream">
      <div className="wrap py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow text-butter mb-3">Example: a real home</p>
            <h2 className="h-section">What does $100 actually get you?</h2>
            <p className="body-lg text-cream/85 mt-4 max-w-xl">
              Say a $1 million townhouse in New Farm is split into 10,000 shares,
              priced at $100 each. Buy one share, you own a ten-thousandth of the home.
              If the home rents for $62,000 a year, your share earns about <strong>$6.20 a year</strong> in rent.
              Sounds small, but you can buy as many shares as you like.
            </p>
            <div className="mt-7 inline-flex flex-wrap gap-3">
              <Link
                href="/buy"
                className="bg-terracotta hover:bg-terracotta-light text-cream rounded-pill px-6 py-3.5 font-semibold min-h-[52px] inline-flex items-center transition-colors"
              >
                See homes you can buy into
              </Link>
            </div>
          </div>

          <div className="bg-cream text-ink rounded-soft p-6 sm:p-8 shadow-lift">
            <p className="eyebrow mb-2">Your monthly rent if you buy</p>
            <div className="space-y-3">
              {[
                { shares: "1 share", cost: "$100", rent: "$0.52" },
                { shares: "10 shares", cost: "$1,000", rent: "$5.20" },
                { shares: "100 shares", cost: "$10,000", rent: "$51.70" },
                { shares: "500 shares", cost: "$50,000", rent: "$258.30" }
              ].map((r) => (
                <div key={r.shares} className="grid grid-cols-3 gap-2 py-3 border-t border-ink/10 first:border-t-0 items-baseline">
                  <span className="font-semibold">{r.shares}</span>
                  <span className="text-ink/70 text-right sm:text-left">{r.cost}</span>
                  <span className="font-display text-xl text-forest text-right">{r.rent}/mo</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink/55 mt-4">
              These numbers are an example. Real rent depends on the home, the tenants, and the market.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reassurance() {
  const items = [
    { t: "Everything is inspected", b: "Independent inspectors check the deed, building, and surveys before a home can be listed." },
    { t: "Identity verified", b: "Buyers and sellers are verified by a regulator. Bots and bad actors can’t get in." },
    { t: "Records can’t be changed", b: "Every transaction is permanent. Nobody can quietly edit who owns what." },
    { t: "Sell whenever you want", b: "List your slices on the marketplace. When someone buys them, you get paid straight away." }
  ];
  return (
    <section className="bg-cream">
      <div className="wrap py-14 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-3">Why people trust it</p>
          <h2 className="h-section">Built to feel safe.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((i, idx) => (
            <div key={i.t} className={`surface p-6 rise rise-${idx + 1}`}>
              <div className="w-10 h-10 rounded-full bg-butter flex items-center justify-center mb-4">
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

function FAQ() {
  const qs = [
    {
      q: "Is this like buying a real house?",
      a: "Not quite. You own a slice of the home, not the whole thing. You don’t live in it, you can’t paint the walls, but you do earn a slice of the rent. Think of it more like owning shares in a small business."
    },
    {
      q: "What if I want to sell?",
      a: "List your slices on the marketplace. When someone buys them, the money goes straight to your account, usually in seconds."
    },
    {
      q: "Do I need to know about crypto?",
      a: "No. You sign in with a free secure account (we’ll walk you through it once). After that it works like any other website."
    },
    {
      q: "What happens if the home gets damaged?",
      a: "The home is insured, and the property manager handles repairs. Your slice doesn’t suddenly disappear; you keep ownership."
    },
    {
      q: "Can I lose money?",
      a: "Yes, like any investment. Home prices can go down. We tell you the risks upfront, every time."
    }
  ];
  return (
    <section className="bg-bone">
      <div className="wrap py-14 sm:py-20 grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-3">Questions</p>
          <h2 className="h-section">You probably want to ask…</h2>
          <p className="body-lg text-ink/70 mt-3">
            We answer the most common ones here. If yours isn’t listed, get in touch.
          </p>
        </div>
        <dl className="lg:col-span-8 space-y-3">
          {qs.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </dl>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left p-5 sm:p-6 min-h-[60px]"
        aria-expanded={open}
      >
        <span className="font-display text-lg sm:text-xl font-semibold pr-4">{q}</span>
        <span className={`shrink-0 transition-transform ${open ? "rotate-45" : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C5545" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 body-sm text-ink/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: a }} />
      ) : null}
    </div>
  );
}

function CTA() {
  return (
    <section className="bg-cream">
      <div className="wrap py-14 sm:py-20">
        <div className="surface p-8 sm:p-12 lg:p-16 text-center">
          <h2 className="h-section max-w-3xl mx-auto">
            A home is a big thing.<br className="hidden sm:inline" /> Owning a piece of one shouldn’t be.
          </h2>
          <p className="body-lg text-ink/70 mt-4 max-w-xl mx-auto">
            Start small. Learn the ropes. Grow your slice when you’re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Link
              href="/buy"
              className="bg-forest text-cream hover:bg-forest-dark rounded-pill px-7 py-4 font-semibold min-h-[52px] inline-flex items-center justify-center transition-colors"
            >
              Browse homes
            </Link>
            <Link
              href="/how-it-works"
              className="border border-ink/20 hover:border-forest hover:text-forest rounded-pill px-7 py-4 font-semibold min-h-[52px] inline-flex items-center justify-center transition-colors"
            >
              Learn more first
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
