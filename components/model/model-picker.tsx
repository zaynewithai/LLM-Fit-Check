"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { CatalogModel } from "@/lib/types";
import { fmtParamLabel } from "@/lib/format";

// Accessible searchable combobox over the catalog. Filters by name / family / repo.
export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: CatalogModel[];
  value: string;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort by popularity (downloads desc) so popular models appear first.
  const sortedModels = useMemo(
    () => [...models].sort((a, b) => b.downloads - a.downloads),
    [models],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedModels;
    return sortedModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        m.repo.toLowerCase().includes(q),
    );
  }, [sortedModels, query]);

  const selected = sortedModels.find((m) => m.slug === value) ?? null;
  const safeActive = Math.min(active, Math.max(filtered.length - 1, 0));
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function pick(slug: string) {
    onChange(slug);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && filtered[safeActive]) {
      e.preventDefault();
      pick(filtered[safeActive].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 focus-within:border-[var(--color-accent)]"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--color-faint)]" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls="model-picker-list"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={selected ? selected.name : "Search 31 models…"}
          value={open ? query : ""}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-faint)]"
        />
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--color-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <ul
          id="model-picker-list"
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-elevated)] py-1 shadow-xl shadow-black/40"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-[var(--color-faint)]">No models match.</li>
          )}
          {filtered.map((m, i) => (
            <li
              key={m.slug}
              role="option"
              aria-selected={m.slug === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(m.slug)}
              className={[
                "flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm",
                i === safeActive ? "bg-[var(--color-accent-soft)] text-[var(--color-heading)]" : "text-[var(--color-ink)]",
              ].join(" ")}
            >
              <span className="min-w-0">
                <span className="truncate">{m.name}</span>
                <span className="ml-2 text-[0.7rem] text-[var(--color-faint)]">{m.family}</span>
              </span>
              <span className="num shrink-0 text-[0.7rem] text-[var(--color-muted)]">
                {fmtParamLabel(m.totalParams, m.activeParams)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
