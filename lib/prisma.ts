// Single shared Prisma client instance.
// In dev, Next.js hot-reloads modules which would otherwise spawn a new
// PrismaClient per change until connections are exhausted — so we stash the
// instance on globalThis and reuse it.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
