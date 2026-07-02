"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { computeFootprint, computeVerdict } from "@/lib/memory";
import type { CatalogModel } from "@/lib/types";
import { fmtGB } from "@/lib/format";
import { Eyebrow } from "../ui";
import { Filters, sizeMatch, type CatalogState, CATALOG_DEFAULTS } from "./filters";
import { ModelCard } from "./model-card";

export function CatalogExplorer({
  models,
  families,
  initial,
}: {
  models: CatalogModel[];
  families: string[];
  initial: Partial<CatalogState>;
}) {
  const pathname = usePathname();
  const [s, setS] = useState<CatalogState>({ ...CATALOG_DEFAULTS, ...initial });
  const [drawer, setDrawer] = useState(false);

  const patch = (p: Partial<CatalogState>) => setS((prev) => ({ ...prev, ...p }));

  // Escape closes the drawer; lock body scroll while it's open.
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (s.search) p.set("s", s.search);
    if (s.family !== "all") p.set("f", s.family);
    if (s.size !== "all") p.set("z", s.size);
    if (s.arch !== "all") p.set("a", s.arch);
    if (s.fit) {
      p.set("fit", "1");
      p.set("m", s.mode);
      if (s.mode === "discrete") {
        p.set("v", String(s.vram));
        p.set("r", String(s.ram));
      } else {
        p.set("u", String(s.unified));
      }
      p.set("q", s.quant);
      p.set("c", String(s.contextTokens));
      p.set("k", s.kvCacheQuantized ? "1" : "0");
    }
    if (s.sort !== "params") p.set("sort", s.sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [s, pathname]);

  const hw = useMemo(
    () =>
      s.fit
        ? s.mode === "discrete"
          ? { mode: "discrete" as const, vramGB: s.vram, ramGB: s.ram }
          : { mode: "unified" as const, unifiedGB: s.unified }
        : null,
    [s.fit, s.mode, s.vram, s.ram, s.unified],
  );

  const items = useMemo(() => {
    const q = s.search.trim().toLowerCase();
    let arr = models.map((m) => {
      const fp = computeFootprint({
        totalParamsB: m.totalParams,
        activeParamsB: m.activeParams,
        quant: s.quant,
        contextTokens: s.contextTokens,
        kvCacheQuantized: s.kvCacheQuantized,
      });
      const verdict = hw ? computeVerdict(fp.totalGB, hw) : null;
      return { model: m, fp, verdict };
    });
    if (q) {
      arr = arr.filter(
        (x) =>
          x.model.name.toLowerCase().includes(q) ||
          x.model.repo.toLowerCase().includes(q) ||
          x.model.family.toLowerCase().includes(q),
      );
    }
    if (s.family !== "all") arr = arr.filter((x) => x.model.family === s.family);
    arr = arr.filter((x) => sizeMatch(x.model.totalParams, s.size));
    if (s.arch === "dense") arr = arr.filter((x) => !x.model.isMoE);
    if (s.arch === "moe") arr = arr.filter((x) => x.model.isMoE);
    if (s.fit && hw) arr = arr.filter((x) => x.verdict !== "won't-fit");
    arr.sort((a, b) =>
      s.sort === "params" ? a.model.totalParams - b.model.totalParams : a.fp.totalGB - b.fp.totalGB,
    );
    return arr;
  }, [models, s.search, s.family, s.size, s.arch, s.fit, hw, s.quant, s.contextTokens, s.kvCacheQuantized, s.sort]);

  const filtersEl = (
    <Filters state={s} onChange={patch} families={families} />
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="pt-6 pb-4 sm:pt-10">
        <Eyebrow>catalog</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Model catalog</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          {models.length} open-weight models. Search, filter, and check what each one needs.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pb-3 lg:hidden">
        <span className="text-sm text-[var(--color-muted)]">
          <span className="num font-semibold text-[var(--color-heading)]">{items.length}</span> shown
        </span>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="grid gap-5 pb-16 lg:grid-cols-[18rem_1fr]">
        {/* desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[4.5rem] rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4">
            {filtersEl}
          </div>
        </aside>

        {/* list */}
        <section aria-label="Models">
          <div className="mb-3 hidden items-center justify-between lg:flex">
            <span className="text-sm text-[var(--color-muted)]">
              <span className="num font-semibold text-[var(--color-heading)]">{items.length}</span> shown
              {s.fit && hw ? ` · budget ${fmtGB(hw.mode === "discrete" ? s.vram + s.ram : s.unified)}` : ""}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-line)] p-10 text-center text-sm text-[var(--color-faint)]">
              No models match these filters.
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((x, i) => (
                <div key={x.model.slug} className="row-in" style={{ animationDelay: `${Math.min(i * 18, 280)}ms` }}>
                  <ModelCard model={x.model} fp={x.fp} verdict={x.verdict} quant={s.quant} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto border-r border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 shadow-2xl row-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-heading)]">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close filters"
                className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filtersEl}
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="mt-4 w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[#0a1120]"
            >
              Show {items.length} models
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
