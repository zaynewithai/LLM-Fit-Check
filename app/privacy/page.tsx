import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LLM Fit Check handles data and advertising.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-3xl font-semibold sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-ink)]">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-heading)]">Data we collect</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            LLM Fit Check does not require an account and does not collect personal data directly.
            The model catalog is fetched from the public Hugging Face API. Your calculator inputs
            (memory, quantization, context) stay in your browser — they are not sent to our server.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-heading)]">Advertising</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            This site displays ads via Google AdSense. Google, as a third-party vendor, uses cookies
            to serve ads based on your prior visits to this and other websites. Google&apos;s use of
            advertising cookies enables it and its partners to serve ads to you based on your visit
            to this site and/or other sites on the internet.
          </p>
          <p className="mt-2 text-[var(--color-muted)]">
            You may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              Google Ads Settings
            </a>
            . You can also opt out of third-party vendors&apos; use of cookies for personalized
            advertising by visiting{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              www.aboutads.info
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-heading)]">Cookies</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            AdSense may use cookies to serve relevant ads. We do not set cookies ourselves.
            Calculator state is encoded in URL query parameters, not cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-heading)]">Contact</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            For privacy questions, open an issue at{" "}
            <a
              href="https://github.com/zaynewithai/LLM-Fit-Check/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              GitHub Issues
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
