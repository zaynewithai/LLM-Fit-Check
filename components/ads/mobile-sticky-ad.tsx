"use client";

import { AdSlot } from "./ad-slot";

// Mobile sticky bottom banner — 320×50.
// Visible only on small screens (<md, <768px). Fixed to viewport bottom.
// Adds bottom padding to body via CSS so content isn't hidden behind it.
export function MobileStickyAd() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-bg-2)]/95 backdrop-blur-md md:hidden"
      aria-label="Advertisement"
    >
      <div className="mx-auto flex max-w-md items-center justify-center py-1.5">
        <AdSlot
          slot="llmfitcheck-mobile-sticky"
          format="horizontal"
          responsive={false}
          style={{ width: 320, height: 50 }}
          label="Ad · 320×50"
        />
      </div>
    </div>
  );
}
