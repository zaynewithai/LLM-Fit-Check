import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { HeaderBanner } from "@/components/ads/header-banner";
import { AdRails } from "@/components/ads/ad-rails";
import { MobileStickyAd } from "@/components/ads/mobile-sticky-ad";
import { config } from "@/lib/config";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LLM Fit Check — what open LLMs fit your hardware?",
    template: "%s · LLM Fit Check",
  },
  description:
    "See which open-source LLMs run on your GPU or Mac, and what hardware a model needs. Live memory-footprint estimates with quantization, context length and KV cache.",
  applicationName: "LLM Fit Check",
  keywords: [
    "LLM",
    "open source LLM",
    "VRAM calculator",
    "model fit",
    "quantization",
    "GGUF",
    "Hugging Face",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${chakra.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {config.adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <HeaderBanner />
        <AdRails>{children}</AdRails>
        <MobileStickyAd />
        {/* spacer so mobile sticky ad doesn't cover footer content */}
        <div className="h-14 md:hidden" aria-hidden />
        <footer className="border-t border-[var(--color-line)] px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-[0.8125rem] text-[var(--color-faint)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Weights are exact · KV cache is an estimate · real GGUF files run ~5–10% larger.
            </p>
            <div className="flex items-center gap-3">
              <a href="/privacy" className="hover:text-[var(--color-muted)]">Privacy</a>
              <span aria-hidden>·</span>
              <p className="num">open-weight models only · auto-synced from Hugging Face</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
