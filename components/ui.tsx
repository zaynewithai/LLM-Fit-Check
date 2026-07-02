"use client";

import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-[var(--color-muted)]"
    >
      {children}
    </label>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={[
              "rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
              active
                ? "bg-[var(--color-accent-soft)] text-[var(--color-heading)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2.5"
    >
      <span
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            : "border-[var(--color-line-strong)] bg-[var(--color-surface-2)]",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-3.5 w-3.5 rounded-full transition-transform",
            checked
              ? "translate-x-[1.125rem] bg-[var(--color-accent)]"
              : "translate-x-[0.125rem] bg-[var(--color-muted)]",
          ].join(" ")}
        />
      </span>
      <span className="text-[0.8125rem] text-[var(--color-ink)]">{label}</span>
    </button>
  );
}

export function NumberField({
  id,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isFinite(v) ? v : 0);
        }}
        className="num w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] text-[var(--color-faint)]">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function SelectField<T extends string | number>({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        const opt = options.find((o) => String(o.value) === raw);
        if (opt) onChange(opt.value);
      }}
      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
