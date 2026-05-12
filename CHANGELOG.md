# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
