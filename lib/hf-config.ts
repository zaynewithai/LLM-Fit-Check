// Fetches a model's config.json from Hugging Face and extracts the anatomical
// fields needed for precise KV cache calculation. Server-only.
//
// Resolves to null when the config is unavailable or incomplete (non-fatal —
// the caller falls back to the empirical KV formula).

const CONFIG_TIMEOUT_MS = 12_000;

export interface HfConfig {
  numLayers: number | null;
  numKvHeads: number | null;
  numQHeads: number | null;
  headDim: number | null;
  hiddenSize: number | null;
}

interface RawConfig {
  num_hidden_layers?: number;
  num_key_value_heads?: number;
  num_attention_heads?: number;
  head_dim?: number;
  hidden_size?: number;
  // some models use these aliases
  n_layer?: number;
  n_head?: number;
  n_kv_head?: number;
  n_embd?: number;
  // Llama-style: derive head_dim from hidden_size / num_attention_heads
  // (head_dim is sometimes absent)
}

export async function fetchHfConfig(repo: string, token: string): Promise<HfConfig | null> {
  const url = `https://huggingface.co/${repo}/raw/main/config.json`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const c = (await res.json()) as RawConfig;

    const numLayers = c.num_hidden_layers ?? c.n_layer ?? null;
    const numQHeads = c.num_attention_heads ?? c.n_head ?? null;
    const hiddenSize = c.hidden_size ?? c.n_embd ?? null;
    const numKvHeads = c.num_key_value_heads ?? c.n_kv_head ?? numQHeads; // MHA fallback: kvHeads = qHeads
    // head_dim: explicit if present, else derive from hidden / qHeads (Llama style)
    let headDim = c.head_dim ?? null;
    if (headDim == null && hiddenSize != null && numQHeads != null && numQHeads > 0) {
      headDim = Math.floor(hiddenSize / numQHeads);
    }

    if (numLayers == null || numKvHeads == null || headDim == null) return null;
    if (numLayers <= 0 || numKvHeads <= 0 || headDim <= 0) return null;

    return { numLayers, numKvHeads, numQHeads, headDim, hiddenSize };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}