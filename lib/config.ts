// Typed, centralized access to environment variables.
// Server-only values (DATABASE_URL, HF_TOKEN, SYNC_SECRET) are read here and
// never shipped to the browser — only NEXT_PUBLIC_* vars reach the client.

export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "LLM Fit Finder",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  hfToken: process.env.HF_TOKEN ?? "",
  syncSecret: process.env.SYNC_SECRET ?? "",
} as const;

export function requireSyncSecret(): string {
  const secret = config.syncSecret;
  if (!secret) {
    throw new Error(
      "SYNC_SECRET is not set. Define it in .env before calling the sync endpoint.",
    );
  }
  return secret;
}
