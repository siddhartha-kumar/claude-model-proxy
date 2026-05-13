# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] — 2026-05-14

### Added

- **16 tier-prefixed Claude aliases** for Claude Desktop's Cowork 3P picker.
  The Cowork model selector surfaces only models whose id matches
  `claude-(haiku|sonnet|opus)-*`. Tier aliases route to the same Ollama
  Cloud and HuggingFace Router upstreams as the longer `claude-ollama-*` /
  `claude-hf-*` aliases, so Cowork users get a tier-organised picker
  without losing the explicit-provider aliases:

  | Tier | Alias | Upstream |
  | --- | --- | --- |
  | Haiku | `claude-haiku-fast` | `qwen3-coder-next:cloud` (Ollama) |
  | Haiku | `claude-haiku-llama-8b` | `meta-llama/Llama-3.1-8B-Instruct` (HF) |
  | Haiku | `claude-haiku-gpt-oss-20b` | `gpt-oss:20b-cloud` (Ollama) |
  | Haiku | `claude-haiku-phi-4` | `microsoft/phi-4` (HF) |
  | Haiku | `claude-haiku-glm` | `glm-4.7:cloud` (Ollama) |
  | Sonnet | `claude-sonnet-coder` | `qwen3-coder:480b-cloud` (Ollama) |
  | Sonnet | `claude-sonnet-llama-70b` | `meta-llama/Llama-3.3-70B-Instruct` (HF) |
  | Sonnet | `claude-sonnet-deepseek-r1` | `deepseek-ai/DeepSeek-R1` (HF) |
  | Sonnet | `claude-sonnet-glm` | `glm-5.1:cloud` (Ollama) |
  | Sonnet | `claude-sonnet-kimi` | `kimi-k2.6:cloud` (Ollama) |
  | Sonnet | `claude-sonnet-mistral` | `mistralai/Mistral-Large-Instruct-2411` (HF) |
  | Opus | `claude-opus-gpt-oss-120b` | `gpt-oss:120b-cloud` (Ollama) |
  | Opus | `claude-opus-kimi-1t` | `kimi-k2:1t-cloud` (Ollama) |
  | Opus | `claude-opus-deepseek-pro` | `deepseek-v4-pro:cloud` (Ollama) |
  | Opus | `claude-opus-llama-405b` | `meta-llama/Llama-3.1-405B-Instruct` (HF) |
  | Opus | `claude-opus-qwen-coder-480b` | `Qwen/Qwen3-Coder-480B-A35B-Instruct` (HF) |

  `/v1/models` now lists 100 default aliases (up from 84).

### Behaviour

- The new aliases route directly to their target provider in
  `DEFAULT_MODEL_ROUTES` (`ollama` or `huggingface`, never `anthropic`).
  This means `resolveModelForUpstream` short-circuits on the exact match
  and the Claude family fallback never engages for tier-prefixed aliases —
  the user gets the actual model they picked, not the configured Haiku /
  Sonnet / Opus fallback.

### Tests

- Suite expanded from 55 to **58** cases. New coverage:
  - All 16 tier aliases exist with the documented upstream id and route.
  - `resolveModelForUpstream` returns the exact upstream for each tier
    alias even when `ANTHROPIC_API_KEY` is empty (regression guard for
    family-fallback interception).
  - Dated tier aliases (e.g. `claude-sonnet-coder-20260514`) resolve via
    the date-stripping path.
  - `/v1/models` (the Cowork picker source) exposes all 16 new aliases.

## [0.3.1] — 2026-05-14

### Fixed

- **Anthropic-spec pagination on `/v1/models`.** Earlier releases ignored the
  `limit`, `after_id`, and `before_id` query parameters and always returned
  the full 84-entry catalog with `has_more: false`. Strict clients such as
  Claude Desktop probe with `?limit=1` first to decide whether to paginate,
  and could end up displaying only a subset of the catalog. The endpoint
  now honors `limit` (1–1000, default 1000), `after_id` (forward cursor),
  `before_id` (backward cursor), and reports `has_more` accurately.
- **`GET /` and `HEAD /` are now answered locally.** Previously they were
  forwarded to the default provider's base URL, which returned a confusing
  `405 Method Not Allowed`. The proxy now returns a small JSON status
  document with the service name, version, and known endpoints. Standalone
  agent SDKs (Bun-based clients) probing the gateway root see a clean 200.
- **`/v1/models/{id}` 404 response shape** now matches Anthropic's
  `{ "type": "error", "error": { "type": "not_found_error", "message": "..." } }`
  envelope.

### Changed

- `SERVER_NAME` and `SERVER_VERSION` are exported from `proxy.mjs` and
  re-exported by `server/index.mjs`. The manifest parity test now reads them
  from the canonical location.

### Tests

- Suite expanded from 48 to **55** cases. New coverage:
  - `?limit=1` returns exactly one model with `has_more=true`.
  - `?limit=1000` returns the full catalog with `has_more=false`.
  - Default `limit` returns the full catalog.
  - Absurd `?limit=999999` is clamped to 1000 without error.
  - `?after_id` and `?before_id` cursor pagination through the catalog.
  - `/v1/models/{unknown-id}` returns the Anthropic-shaped error envelope.
  - `GET /` and `HEAD /` are answered locally and never forwarded upstream.

## [0.3.0] — 2026-05-13

### Added

- **HuggingFace Inference Router** as a first-class provider. 22 new
  `claude-hf-*` aliases covering Llama 3.1/3.3, Qwen 2.5/3, DeepSeek V3/V3.1/R1,
  Mistral Large/Mixtral/Mistral 7B, Gemma 2, Phi-4/Phi-3-medium, Command R+,
  Yi 1.5, and Nemotron 70B. One HF token gives access to Together, Fireworks,
  HF Inference, Hyperbolic, SambaNova, Novita, and Nebius via HF Router's
  auto-routing.
- MCPB install dialog gains `HuggingFace Router Base URL` and
  `HuggingFace API Token` fields.
- `HUGGINGFACE_API_KEY` env var with `HF_API_KEY` and `HF_TOKEN` accepted as
  aliases.
- LICENSE (MIT), SECURITY.md, CHANGELOG.md, CONTRIBUTING.md.
- Professional README with architecture diagram, security section, and full
  configuration reference.

### Changed

- **`REWRITE_RESPONSES` default flipped from `true` to `false`.** Upstream
  model ids now pass through unchanged in response bodies and SSE streams by
  default. Opt back into Claude-alias rewriting with `REWRITE_RESPONSES=true`.
- Manifest, `package.json`, and `server/index.mjs` `SERVER_VERSION` bumped to
  `0.3.0`.
- `/v1/models` now lists 84 default aliases (up from 62).

### Tests

- Suite expanded from 46 to **48** cases. New coverage:
  - `REWRITE_RESPONSES` default + explicit opt-in / opt-out.
  - End-to-end pass-through of upstream model ids when `rewriteResponses=false`.

## [0.2.0] — 2026-05-13

### Added

- **Smart Claude model resolution.** Date-suffixed aliases such as
  `claude-haiku-4-5-20251001` are stripped before lookup and, when
  `ANTHROPIC_API_KEY` is empty, routed through a configurable Haiku / Sonnet /
  Opus family fallback (`CLAUDE_HAIKU_MODEL`, `CLAUDE_SONNET_MODEL`,
  `CLAUDE_OPUS_MODEL`).
- **Local `POST /v1/messages/count_tokens`** answered with a deterministic
  character heuristic, so Anthropic-only endpoints don't fail against
  OpenAI-shape upstreams.
- `default_provider`, `claude_haiku_model`, `claude_sonnet_model`,
  `claude_opus_model` fields in the MCPB install dialog.
- Anthropic-compatible `/v1/models` response shape (`id`, `type`,
  `display_name`, `created_at`) so Claude Desktop's "fetch from gateway"
  populates the model dropdown automatically.

### Fixed

- **`/v1/v1/messages/count_tokens` 404.** `buildTargetUrl` now strips a
  leading `/v1` from the source path when the upstream base URL ends in
  `/v1`, preventing path duplication for Ollama Cloud, HuggingFace Router,
  Gemini, and Qwen.
- Dated Claude model names (`claude-haiku-4-5-20251001`) no longer 404 at
  Ollama Cloud — they're resolved to the family fallback before forwarding.

### Tests

- Suite expanded from 17 to 42 cases.

## [0.1.0] — 2026-05-12

### Added

- Initial public release.
- Routing for DeepSeek, Moonshot/Kimi, GLM, Xiaomi MiMo, OpenAI, Gemini,
  Qwen, Ollama Cloud (Turbo), and Anthropic.
- Anthropic Messages-compatible inbound surface.
- OpenAI Chat Completions ↔ Anthropic Messages adapter (JSON + streaming SSE).
- MCPB packaging for Claude Desktop on Windows and macOS.
- MCP `model_proxy_status` stdio tool exposed by the bundled server.
- macOS LaunchAgent installer (`npm run launch-agent:install`).
