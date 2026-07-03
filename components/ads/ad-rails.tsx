import { AdSlot } from "./ad-slot";

// Left and right sticky ad rails — skyscraper 160×600.
// Visible only on xl+ screens (≥1280px). Hidden on mobile/tablet.
// Sticky so they stay in view while scrolling the main content.

const RAIL_WIDTH = 160;
const RAIL_HEIGHT = 600;

export function AdRails({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex justify-center gap-4">
      {/* left rail */}
      <aside
        className="hidden xl:block shrink-0"
        style={{ width: RAIL_WIDTH }}
        aria-label="Advertisement"
      >
        <div className="sticky top-[4.75rem]">
          <AdSlot
            slot="llmfitcheck-left-rail"
            format="vertical"
            responsive={false}
            style={{ width: RAIL_WIDTH, height: RAIL_HEIGHT }}
            label="Ad · 160×600"
          />
        </div>
      </aside>

      {/* main content */}
      <div className="min-w-0 flex-1 max-w-6xl">{children}</div>

      {/* right rail */}
      <aside
        className="hidden xl:block shrink-0"
        style={{ width: RAIL_WIDTH }}
        aria-label="Advertisement"
      >
        <div className="sticky top-[4.75rem]">
          <AdSlot
            slot="llmfitcheck-right-rail"
            format="vertical"
            responsive={false}
            style={{ width: RAIL_WIDTH, height: RAIL_HEIGHT }}
            label="Ad · 160×600"
          />
        </div>
      </aside>
    </div>
  );
}
