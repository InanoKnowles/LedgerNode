import { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Card({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`surface p-5 sm:p-6 md:p-8 ${className}`}>{children}</div>;
}

export function Button({
  children,
  onClick,
  disabled,
  full,
  tone = "primary",
  type = "button"
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  tone?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
}) {
  const tones = {
    primary:
      "bg-forest text-cream hover:bg-forest-dark active:bg-forest-dark disabled:bg-ink/20",
    secondary:
      "bg-terracotta text-cream hover:bg-terracotta-light active:bg-terracotta-light disabled:bg-ink/20",
    ghost:
      "bg-transparent text-ink border border-ink/20 hover:border-forest hover:text-forest"
  }[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${tones} rounded-pill px-5 py-3 sm:px-6 sm:py-3.5 font-semibold text-base
        min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed
        transition-colors inline-flex items-center justify-center gap-2
        ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block mb-5">
      <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
      {hint ? <span className="block text-xs text-ink/60 mb-2">{hint}</span> : null}
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/60 border border-ink/15 rounded-soft px-4 py-3 text-base
        min-h-[48px] focus:outline-none focus:border-forest focus:bg-white
        transition-colors ${props.className ?? ""}`}
    />
  );
}

export function Notice({
  kind,
  title,
  children
}: {
  kind: "info" | "ok" | "err";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: "bg-sky/40 border-sky text-forest-dark",
    ok: "bg-butter/50 border-butter text-forest-dark",
    err: "bg-terracotta-soft border-terracotta text-terracotta"
  }[kind];
  return (
    <div className={`border ${styles} rounded-soft p-4 text-sm leading-relaxed`}>
      {title ? <p className="font-semibold mb-1">{title}</p> : null}
      <div className="whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
}

export function Pill({ children, tone = "forest" }: { children: ReactNode; tone?: "forest" | "terracotta" | "butter" }) {
  const t = {
    forest: "bg-forest text-cream",
    terracotta: "bg-terracotta text-cream",
    butter: "bg-butter text-forest-dark"
  }[tone];
  return (
    <span className={`${t} rounded-pill px-3 py-1 text-xs font-semibold inline-block`}>
      {children}
    </span>
  );
}
