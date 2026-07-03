"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Reusable AdSense slot.
// - No client ID configured (dev) → labeled placeholder, no script.
// - Client ID configured (prod) → real <ins class="adsbygoogle"> + push.
export function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  style,
  label = "Advertisement",
}: {
  slot?: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  label?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet — harmless
    }
  }, [client]);

  // Dev / unconfigured → placeholder
  if (!client) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/30 text-center"
        style={style}
      >
        <span className="eyebrow px-2 py-1 text-[var(--color-faint)]">{label}</span>
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
