// Plain, serializable model shape shared between server (DB) and client (UI).
// Dates are ISO strings so they cross the RSC boundary safely.

export interface CatalogModel {
  slug: string;
  name: string;
  repo: string;
  family: string;
  totalParams: number; // billions
  activeParams: number | null; // billions, null = dense
  isMoE: boolean;
  openWeights: boolean;
  gated: boolean;
  downloads: number;
  likes: number;
  numLayers: number | null;
  numKvHeads: number | null;
  numQHeads: number | null;
  headDim: number | null;
  hiddenSize: number | null;
  lastSyncedAt: string | null;
  createdAt: string | null;
}
