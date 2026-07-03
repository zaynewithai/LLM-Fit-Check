import { AdSlot } from "./ad-slot";

// Header leaderboard — 728×90 on desktop, responsive on mobile.
// Sits right below the site header on every page.
export function HeaderBanner() {
  return (
    <div className="w-full border-b border-[var(--color-line)] bg-[var(--color-bg-2)]/50 py-2">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 sm:px-6">
        <AdSlot
          slot="llmfitcheck-header"
          format="horizontal"
          responsive={true}
          style={{ maxWidth: 728, minHeight: 90, width: "100%" }}
          label="Ad · 728×90"
        />
      </div>
    </div>
  );
}
