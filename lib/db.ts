// Server-only data access. Reads from Prisma and maps to the serializable
// CatalogModel shape that crosses the RSC boundary into Client Components.

import { prisma } from "./prisma";
import type { CatalogModel } from "./types";

function toModel(r: {
  slug: string;
  name: string;
  repo: string;
  family: string;
  totalParams: number;
  activeParams: number | null;
  isMoE: boolean;
  openWeights: boolean;
  gated: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date | null;
}): CatalogModel {
  return {
    slug: r.slug,
    name: r.name,
    repo: r.repo,
    family: r.family,
    totalParams: r.totalParams,
    activeParams: r.activeParams,
    isMoE: r.isMoE,
    openWeights: r.openWeights,
    gated: r.gated,
    lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  };
}

export async function getModels(): Promise<CatalogModel[]> {
  const rows = await prisma.model.findMany({ orderBy: { totalParams: "asc" } });
  return rows.map(toModel);
}

export async function getModelBySlug(slug: string): Promise<CatalogModel | null> {
  const row = await prisma.model.findUnique({ where: { slug } });
  return row ? toModel(row) : null;
}

export async function getFamilies(): Promise<string[]> {
  const rows = await prisma.model.findMany({
    select: { family: true },
    distinct: ["family"],
    orderBy: { family: "asc" },
  });
  return rows.map((r) => r.family);
}
