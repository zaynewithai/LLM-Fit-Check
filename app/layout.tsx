import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

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
    default: "LLM Fit Finder — what open LLMs fit your hardware?",
    template: "%s · LLM Fit Finder",
  },
  description:
    "See which open-source LLMs run on your GPU or Mac, and what hardware a model needs. Live memory-footprint estimates with quantization, context length and KV cache.",
  applicationName: "LLM Fit Finder",
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
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--color-line)] px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 text-[0.8125rem] text-[var(--color-faint)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Weights are exact · KV cache is an estimate · real GGUF files run ~5–10% larger.
            </p>
            <p className="num">open-weight models only · auto-synced from Hugging Face</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
