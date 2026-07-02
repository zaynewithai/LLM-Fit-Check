// The open-weight model seed catalog.
// Edit this list to add or change models — `npm run seed` upserts it into the DB.
// `total`/`active` are in BILLIONS of parameters. `active` is null for dense models.
// The sync job (lib/sync.ts) overwrites `total` with the exact value from Hugging Face;
// `active` is kept from here (Hugging Face does not expose active params for MoE).

export interface SeedModel {
  name: string;
  repo: string;
  family: string;
  total: number; // billions
  active: number | null; // billions, null = dense
}

export const SEED_MODELS: SeedModel[] = [
  { name: "Qwen3 0.6B", repo: "Qwen/Qwen3-0.6B", family: "Qwen", total: 0.6, active: null },
  { name: "Qwen3 1.7B", repo: "Qwen/Qwen3-1.7B", family: "Qwen", total: 1.7, active: null },
  { name: "Gemma 3 1B", repo: "google/gemma-3-1b-it", family: "Gemma", total: 1, active: null },
  { name: "Qwen3 4B", repo: "Qwen/Qwen3-4B", family: "Qwen", total: 4, active: null },
  { name: "Gemma 3 4B", repo: "google/gemma-3-4b-it", family: "Gemma", total: 4, active: null },
  { name: "Qwen3 8B", repo: "Qwen/Qwen3-8B", family: "Qwen", total: 8, active: null },
  { name: "Llama 3.1 8B", repo: "meta-llama/Llama-3.1-8B-Instruct", family: "Llama", total: 8, active: null },
  { name: "Mistral 7B", repo: "mistralai/Mistral-7B-Instruct-v0.3", family: "Mistral", total: 7.3, active: null },
  { name: "Gemma 3 12B", repo: "google/gemma-3-12b-it", family: "Gemma", total: 12, active: null },
  { name: "Mistral Nemo 12B", repo: "mistralai/Mistral-Nemo-Instruct-2407", family: "Mistral", total: 12, active: null },
  { name: "Qwen3 14B", repo: "Qwen/Qwen3-14B", family: "Qwen", total: 14, active: null },
  { name: "Phi-4 14B", repo: "microsoft/phi-4", family: "Phi", total: 14, active: null },
  { name: "Mistral Small 24B", repo: "mistralai/Mistral-Small-24B-Instruct-2501", family: "Mistral", total: 24, active: null },
  { name: "Gemma 3 27B", repo: "google/gemma-3-27b-it", family: "Gemma", total: 27, active: null },
  { name: "Qwen3 32B", repo: "Qwen/Qwen3-32B", family: "Qwen", total: 32, active: null },
  { name: "QwQ 32B", repo: "Qwen/QwQ-32B", family: "Qwen", total: 32, active: null },
  { name: "Llama 3.3 70B", repo: "meta-llama/Llama-3.3-70B-Instruct", family: "Llama", total: 70, active: null },
  { name: "gpt-oss 20B", repo: "openai/gpt-oss-20b", family: "OpenAI", total: 21, active: 4 },
  { name: "Qwen3 30B-A3B", repo: "Qwen/Qwen3-30B-A3B", family: "Qwen", total: 30, active: 3 },
  { name: "gpt-oss 120B", repo: "openai/gpt-oss-120b", family: "OpenAI", total: 120, active: 5 },
  { name: "Mixtral 8x7B", repo: "mistralai/Mixtral-8x7B-Instruct-v0.1", family: "Mistral", total: 47, active: 13 },
  { name: "Llama 4 Scout", repo: "meta-llama/Llama-4-Scout-17B-16E-Instruct", family: "Llama", total: 109, active: 17 },
  { name: "Mixtral 8x22B", repo: "mistralai/Mixtral-8x22B-Instruct-v0.1", family: "Mistral", total: 141, active: 39 },
  { name: "Qwen3 235B-A22B", repo: "Qwen/Qwen3-235B-A22B", family: "Qwen", total: 235, active: 22 },
  { name: "GLM-4.6", repo: "zai-org/GLM-4.6", family: "Z.ai", total: 355, active: 32 },
  { name: "Llama 4 Maverick", repo: "meta-llama/Llama-4-Maverick-17B-128E-Instruct", family: "Llama", total: 400, active: 17 },
  { name: "MiniMax-M1", repo: "MiniMaxAI/MiniMax-M1-80k", family: "MiniMax", total: 456, active: 46 },
  { name: "DeepSeek V3", repo: "deepseek-ai/DeepSeek-V3", family: "DeepSeek", total: 671, active: 37 },
  { name: "DeepSeek R1", repo: "deepseek-ai/DeepSeek-R1", family: "DeepSeek", total: 671, active: 37 },
  { name: "GLM-5.2", repo: "zai-org/GLM-5.2", family: "Z.ai", total: 744, active: 40 },
  { name: "Kimi K2", repo: "moonshotai/Kimi-K2-Instruct", family: "Moonshot", total: 1000, active: 32 },
];

// HF does not expose active params for MoE models, and family/name need curation.
// Discovery/sync use this map to enrich HF-sourced models with curated data.
export interface SeedOverride {
  name: string;
  family: string;
  activeParams: number | null;
}

export const SEED_OVERRIDE: Record<string, SeedOverride> = Object.fromEntries(
  SEED_MODELS.map((m) => [
    m.repo,
    { name: m.name, family: m.family, activeParams: m.active },
  ]),
);
