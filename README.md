<div align="center">

# Claude Model Proxy

**A local OpenAI- and Anthropic-compatible gateway that maps Claude-style
model names onto the upstream of your choice.**

[![Node.js](https://img.shields.io/badge/node-%E2%89%A518-43853d?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Signed commits](https://img.shields.io/badge/commits-signed%20(SSH)-success?logo=git)](#security)
[![Tests](https://img.shields.io/badge/tests-48%20passing-brightgreen)](#testing)
[![MCPB](https://img.shields.io/badge/Claude%20Desktop-MCPB%20extension-7c3aed)](#claude-desktop-extension)

</div>

---

## Overview

Claude Model Proxy is a lightweight (~1 800 LOC, zero runtime dependencies
beyond `dotenv`) HTTP service that lets **Claude Desktop's Gateway / third-party
inference** feature talk to any of the following upstreams from a single local
endpoint, selected per request by model name:

| Provider | Format | Default base URL |
| --- | --- | --- |
| Ollama Cloud (Turbo) | OpenAI-chat | `https://ollama.com/v1` |
| HuggingFace Inference Router | OpenAI-chat | `https://router.huggingface.co/v1` |
| OpenAI | OpenAI-chat | `https://api.openai.com/v1` |
| Google Gemini (OpenAI surface) | OpenAI-chat | `https://generativelanguage.googleapis.com/v1beta/openai` |
| Alibaba Qwen / DashScope | OpenAI-chat | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| DeepSeek | Anthropic Messages | `https://api.deepseek.com/anthropic` |
| Moonshot / Kimi | Anthropic Messages | `https://api.moonshot.cn/anthropic` |
| Z.AI / GLM (Zhipu) | Anthropic Messages | `https://api.z.ai/api/anthropic` |
| Xiaomi MiMo | Anthropic Messages | `https://api.xiaomimimo.com/anthropic` |
| Anthropic (native) | Anthropic Messages | `https://api.anthropic.com` |

The proxy ships as a Claude Desktop MCPB extension (Windows + macOS) and as a
standalone Node service for CI, headless servers, or Claude Code CLI use.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Claude Desktop (MCPB)](#claude-desktop-mcpb)
  - [Standalone](#standalone)
- [Configuration](#configuration)
  - [Core settings](#core-settings)
  - [Provider credentials](#provider-credentials)
  - [Claude family fallback](#claude-family-fallback)
  - [Routing overrides](#routing-overrides)
- [Model Catalog](#model-catalog)
- [Endpoints](#endpoints)
- [Claude Code CLI Integration](#claude-code-cli-integration)
- [macOS LaunchAgent](#macos-launchagent)
- [Testing](#testing)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Versioning](#versioning)
- [Project Layout](#project-layout)
- [License](#license)

## Features

- **Unified Anthropic Messages surface** — clients always speak
  `POST /v1/messages`, `POST /v1/messages/count_tokens`, and `GET /v1/models`.
  The proxy handles upstream API-shape translation transparently.
- **OpenAI-chat ↔ Anthropic adapter** — full JSON and Server-Sent Event
  streaming conversion for OpenAI / Gemini / Qwen / Ollama Cloud / HuggingFace
  upstreams.
- **Smart Claude model resolution** — date-suffixed aliases that Claude Desktop
  emits internally (e.g. `claude-haiku-4-5-20251001`) are stripped and routed
  through a configurable Haiku / Sonnet / Opus fallback when no
  `ANTHROPIC_API_KEY` is configured. The dropdown still works, title generation
  still works, no Anthropic billing required.
- **Local `count_tokens`** — answered with a deterministic character heuristic
  so Anthropic-only endpoints don't need to be forwarded to OpenAI-shape
  upstreams that don't implement them.
- **Anthropic-compatible `/v1/models`** — `id`, `type`, `display_name`,
  `created_at` for all 84 baked-in aliases plus any user overrides. The Claude
  Desktop model dropdown auto-populates from this list.
- **Per-request response rewriting** — opt-in via `REWRITE_RESPONSES=true`,
  rewrites upstream model ids back to the Claude alias the client asked for in
  both JSON and SSE responses.
- **Provider disambiguation by alias** — the same upstream id (`glm-4.6`) is
  served by both Z.AI and Ollama Cloud; the proxy routes by request alias so
  `claude-glm-4.6` → Z.AI and `claude-ollama-glm-4.6` → Ollama, no collision.
- **MCPB-packaged** — a single `.mcpb` install drops the proxy into Claude
  Desktop on Windows or macOS, with a guided install dialog for the most
  common keys.

## Architecture

```
┌──────────────────────┐         ┌──────────────────────────┐
│   Claude Desktop /   │ HTTPS   │  claude-model-proxy      │
│   Claude Code CLI    │ ──────▶ │  127.0.0.1:8787          │
│  (Anthropic shape)   │         │                          │
└──────────────────────┘         │  ┌────────────────────┐  │
                                 │  │  Local endpoints   │  │
                                 │  │  /healthz          │  │
                                 │  │  /v1/models        │  │
                                 │  │  /v1/messages/     │  │
                                 │  │    count_tokens    │  │
                                 │  └────────────────────┘  │
                                 │                          │
                                 │  ┌────────────────────┐  │
                                 │  │ Model resolver     │  │
                                 │  │  • strip date      │  │
                                 │  │  • family fallback │  │
                                 │  │  • alias → upstream│  │
                                 │  └────────┬───────────┘  │
                                 │           │              │
                                 │  ┌────────▼───────────┐  │
                                 │  │ Adapter layer      │  │
                                 │  │  Anthropic ↔ OAI   │  │
                                 │  │  JSON + SSE        │  │
                                 │  └────────┬───────────┘  │
                                 └───────────┼──────────────┘
                                             │
                ┌────────────────────────────┼─────────────────────────────┐
                ▼                  ▼         ▼          ▼                  ▼
        Ollama Cloud        HuggingFace   OpenAI     DeepSeek         Anthropic
       (Turbo, OAI)        Router (OAI)   (OAI)    (Anthropic)       (Anthropic)
        Moonshot Kimi      Gemini (OAI)   Qwen     Z.AI / GLM
        Xiaomi MiMo                                 (Anthropic)
```

Two API shapes, one inbound surface. The proxy keeps your client code
Anthropic-shaped while you choose any upstream at runtime by model name.

## Quick Start

### Claude Desktop (MCPB)

```sh
git clone git@github.com:siddhartha-kumar/claude-model-proxy.git
cd claude-model-proxy
npm install
npm run build:mcpb
```

Output: `dist/claude-model-proxy-0.3.0.mcpb`.

1. **Enable Developer Mode** in Claude Desktop (Settings → General, or Help
   menu — varies by build; restart the app afterwards).
2. **Install the extension** at Settings → Extensions / Connectors → Advanced
   settings → Install Extension → select the `.mcpb` from the step above.
3. **Fill in the install dialog.** A minimal Ollama-Cloud-only setup needs only
   the highlighted rows below; the others are optional.

   | Field | Required | Value |
   | --- | :---: | --- |
   | Gateway Base URL | ✓ | `http://127.0.0.1:8787` |
   | Local Proxy Port | ✓ | `8787` |
   | Default Provider | ✓ | `ollama` (or `huggingface`) |
   | **Ollama Cloud API Key** | ★ | get at [ollama.com/settings/keys](https://ollama.com/settings/keys) |
   | **HuggingFace API Token** | ★ | get at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
   | Claude Haiku Fallback Alias | | `claude-ollama-qwen3-coder-next` |
   | Claude Sonnet Fallback Alias | | `claude-ollama-qwen3-coder` |
   | Claude Opus Fallback Alias | | `claude-ollama-gpt-oss-120b` |
   | DeepSeek / Moonshot keys | | _blank unless you use them_ |
   | Optional Advanced Settings JSON | | `{}` (GLM, Xiaomi, OpenAI, Gemini, Qwen, Anthropic keys live here) |

   ★ = at least one inference provider key is required.

4. **Wire the gateway.** Settings → Developer Mode → Third-party inference →
   Gateway.

   | Field | Value |
   | --- | --- |
   | Provider | `Gateway` |
   | Gateway base URL | `http://127.0.0.1:8787` |
   | Gateway API key | any non-empty placeholder (e.g. `dummy-claude-model-proxy`) |
   | Gateway auth scheme | `bearer` |
   | Model list | *Fetch from gateway* — auto-populates 84 aliases |

5. **Open a new chat** and pick any `claude-ollama-*` or `claude-hf-*` model.
   Anything Claude Desktop sends in the background (title generation,
   `count_tokens`, summarisation) is routed through the same provider via the
   family-fallback resolver.

### Standalone

```sh
cp .env.example .env
# Fill at minimum OLLAMA_API_KEY or HUGGINGFACE_API_KEY
npm install
npm start
```

The startup banner prints every configured provider with a checkmark next to
the ones that have API keys plus the active Claude family fallback table.

<details>
<summary><strong>Windows PowerShell</strong></summary>

```powershell
Copy-Item .env.example .env
notepad .env

# Load .env into the current PowerShell session:
Get-Content .env | Where-Object { $_ -match '^\s*[^#].+=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}

npm start
```
</details>

<details>
<summary><strong>Windows cmd.exe</strong></summary>

```bat
copy .env.example .env
notepad .env
set OLLAMA_API_KEY=...
npm start
```
</details>

## Configuration

All settings come from environment variables. Standalone runs read `.env`
automatically via `dotenv`; the MCPB install dialog writes the same variables
for you.

### Core settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `http://127.0.0.1:8787` | The URL Claude Desktop calls. |
| `PORT` | `8787` | Local listen port. |
| `DEFAULT_PROVIDER` | `deepseek` | Fallback for unmapped models. Set to `ollama` or `huggingface` for single-provider setups. |
| `REWRITE_RESPONSES` | `false` | When `true`, the proxy rewrites upstream model ids back to the Claude alias in both JSON responses and SSE streams. |
| `DEBUG_PROXY` | `false` | Verbose request / routing / response logging. Leave off in production — request bodies can be large. |
| `REQUEST_BODY_LIMIT_BYTES` | `52428800` (50 MB) | Maximum incoming request size. |

### Provider credentials

| Variable | Aliases accepted | Default base URL override |
| --- | --- | --- |
| `OLLAMA_API_KEY` | — | `OLLAMA_BASE_URL` |
| `HUGGINGFACE_API_KEY` | `HF_API_KEY`, `HF_TOKEN` | `HUGGINGFACE_BASE_URL`, `HF_BASE_URL` |
| `DEEPSEEK_API_KEY` | `UPSTREAM_API_KEY` | `DEEPSEEK_BASE_URL` |
| `MOONSHOT_API_KEY` | `KIMI_API_KEY` | `MOONSHOT_BASE_URL`, `KIMI_BASE_URL` |
| `GLM_API_KEY` | `ZAI_API_KEY`, `ZHIPU_API_KEY` | `GLM_BASE_URL`, `ZAI_BASE_URL`, `ZHIPU_BASE_URL` |
| `XIAOMI_API_KEY` | `MIMO_API_KEY` | `XIAOMI_BASE_URL`, `MIMO_BASE_URL` |
| `OPENAI_API_KEY` | — | `OPENAI_BASE_URL` |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` | `GEMINI_BASE_URL`, `GOOGLE_BASE_URL` |
| `QWEN_API_KEY` | `DASHSCOPE_API_KEY` | `QWEN_BASE_URL`, `DASHSCOPE_BASE_URL` |
| `ANTHROPIC_API_KEY` | — | `ANTHROPIC_BASE_URL`, `ANTHROPIC_VERSION` |

Any provider with an empty API key is still wired into the routing table — the
forwarded request will simply fail at the upstream stage with the provider's
own auth error. Leave keys blank for providers you don't use.

### Claude family fallback

Used **only** when `ANTHROPIC_API_KEY` is empty. Any incoming
`claude-haiku-*`, `claude-sonnet-*`, or `claude-opus-*` (including dated
variants like `claude-haiku-4-5-20251001`) is rewritten to the alias below
**before** routing.

| Variable | Default | Use case |
| --- | --- | --- |
| `CLAUDE_HAIKU_MODEL` | `claude-ollama-qwen3-coder-next` | Fast, low-cost generations. |
| `CLAUDE_SONNET_MODEL` | `claude-ollama-qwen3-coder` | Default chat model. |
| `CLAUDE_OPUS_MODEL` | `claude-ollama-gpt-oss-120b` | Long-context, complex reasoning. |

Each value must be a Claude alias that exists in `MODEL_MAP`. Useful HF-only
overrides:

```bash
CLAUDE_HAIKU_MODEL=claude-hf-llama-3.1-8b
CLAUDE_SONNET_MODEL=claude-hf-qwen-2.5-coder-32b
CLAUDE_OPUS_MODEL=claude-hf-llama-3.1-405b
```

### Routing overrides

Three optional environment variables, each accepting a JSON object or a
`from=to,from=to` list. Merged on top of the built-in defaults so partial
overrides are safe.

- `MODEL_MAP` — Claude alias → upstream id.
- `MODEL_ALIASES` — upstream id → Claude alias for response rewriting.
- `MODEL_ROUTES` — alias **or** upstream id → provider name.

The MCPB install dialog's **Optional Advanced Settings JSON** field accepts a
single blob with the same keys:

```json
{
  "GLM_API_KEY": "...",
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "REWRITE_RESPONSES": "true",
  "DEBUG_PROXY": "true",
  "MODEL_MAP": "{\"claude-hf-my-model\":\"vendor/Some-Model\"}",
  "MODEL_ROUTES": "{\"claude-hf-my-model\":\"huggingface\"}"
}
```

## Model Catalog

The default catalog ships with 84 aliases across all providers. The
canonical, live source of truth is always:

```sh
curl http://127.0.0.1:8787/v1/models
```

A condensed summary by provider follows.

### Anthropic native (when `ANTHROPIC_API_KEY` is set)

`claude-haiku-4-5`, `claude-sonnet-4-5`, `claude-sonnet-4-6`,
`claude-opus-4-1`, `claude-opus-4-7`.

### DeepSeek

`claude-deepseek-v4-flash`, `claude-deepseek-v4-pro`.

### Moonshot / Kimi

`claude-kimi-k2.6`.

### Z.AI / GLM

`claude-glm-4.5-air`, `claude-glm-4.6`, `claude-glm-4.7`, `claude-glm-5`,
`claude-glm-5.1`.

### Xiaomi MiMo

`claude-mimo-v2-flash`, `claude-mimo-v2-pro`, `claude-mimo-v2.5-pro`,
`claude-mimo-v2-omni`.

### OpenAI

`claude-gpt-5.5`, `claude-gpt-5.4`, `claude-gpt-5.4-mini`.

### Gemini

`claude-gemini-2.0-flash`, `claude-gemini-2.5-flash`, `claude-gemini-2.5-pro`,
`claude-gemini-3-flash-preview`, `claude-gemini-3.1-flash-lite-preview`,
`claude-gemini-3.1-pro-preview`.

### Qwen / DashScope

`claude-qwen-flash`, `claude-qwen-plus`, `claude-qwen-max`.

### Ollama Cloud (Turbo) — 30 aliases

| Alias | Upstream id |
| --- | --- |
| `claude-ollama-gpt-oss-20b` | `gpt-oss:20b-cloud` |
| `claude-ollama-gpt-oss-120b` | `gpt-oss:120b-cloud` |
| `claude-ollama-deepseek-v3.1` | `deepseek-v3.1:671b-cloud` |
| `claude-ollama-deepseek-v3.2` | `deepseek-v3.2:cloud` |
| `claude-ollama-deepseek-v4-flash` (alias `claude-dsv4-flash`) | `deepseek-v4-flash:cloud` |
| `claude-ollama-deepseek-v4-pro` (alias `claude-dsv4-pro`) | `deepseek-v4-pro:cloud` |
| `claude-ollama-qwen3-coder` | `qwen3-coder:480b-cloud` |
| `claude-ollama-qwen3-coder-next` | `qwen3-coder-next:cloud` |
| `claude-ollama-qwen3-vl`, `claude-ollama-qwen3-vl-instruct` | `qwen3-vl:235b-cloud`, `qwen3-vl:235b-instruct-cloud` |
| `claude-ollama-qwen3-next` | `qwen3-next:80b-cloud` |
| `claude-ollama-qwen3.5` | `qwen3.5:cloud` |
| `claude-ollama-kimi-k2` | `kimi-k2:1t-cloud` |
| `claude-ollama-kimi-k2-thinking` | `kimi-k2-thinking:cloud` |
| `claude-ollama-kimi-k2.6` | `kimi-k2.6:cloud` |
| `claude-ollama-glm-4.6`, `claude-ollama-glm-4.7`, `claude-ollama-glm-5` | matching `glm-*:cloud` |
| `claude-ollama-glm-5.1` (alias `claude-glm51`) | `glm-5.1:cloud` |
| `claude-ollama-minimax-m2`, `…-m2.1`, `…-m2.5`, `…-m2.7` | matching `minimax-*:cloud` |
| `claude-ollama-nemotron-3-nano`, `claude-ollama-nemotron-3-super` | `nemotron-3-nano:30b-cloud`, `nemotron-3-super:cloud` |
| `claude-ollama-devstral-small-2`, `claude-ollama-ministral-3` | `devstral-small-2:24b-cloud`, `ministral-3:8b-cloud` |
| `claude-ollama-gemma4-31b` | `gemma4:31b-cloud` |
| `claude-ollama-gemini-3-flash-preview` | `gemini-3-flash-preview:cloud` |
| `claude-ollama-rnj-1` | `rnj-1:8b-cloud` |

> **Important.** Ollama Cloud requires the `-cloud` (sized) or `:cloud`
> (unsized) routing tag; bare ids hit local-only weights and 404.

### HuggingFace Inference Router — 22 aliases

| Alias | Upstream id |
| --- | --- |
| `claude-hf-llama-3.3-70b` | `meta-llama/Llama-3.3-70B-Instruct` |
| `claude-hf-llama-3.1-405b` | `meta-llama/Llama-3.1-405B-Instruct` |
| `claude-hf-llama-3.1-70b` | `meta-llama/Llama-3.1-70B-Instruct` |
| `claude-hf-llama-3.1-8b` | `meta-llama/Llama-3.1-8B-Instruct` |
| `claude-hf-qwen-2.5-72b` | `Qwen/Qwen2.5-72B-Instruct` |
| `claude-hf-qwen-2.5-coder-32b` | `Qwen/Qwen2.5-Coder-32B-Instruct` |
| `claude-hf-qwen-3-coder-480b` | `Qwen/Qwen3-Coder-480B-A35B-Instruct` |
| `claude-hf-qwen-3-235b` | `Qwen/Qwen3-235B-A22B` |
| `claude-hf-deepseek-v3` | `deepseek-ai/DeepSeek-V3` |
| `claude-hf-deepseek-v3.1` | `deepseek-ai/DeepSeek-V3.1` |
| `claude-hf-deepseek-r1` | `deepseek-ai/DeepSeek-R1` |
| `claude-hf-deepseek-r1-distill-llama-70b` | `deepseek-ai/DeepSeek-R1-Distill-Llama-70B` |
| `claude-hf-mistral-large-2411` | `mistralai/Mistral-Large-Instruct-2411` |
| `claude-hf-mixtral-8x7b` | `mistralai/Mixtral-8x7B-Instruct-v0.1` |
| `claude-hf-mistral-7b` | `mistralai/Mistral-7B-Instruct-v0.3` |
| `claude-hf-gemma-2-27b` | `google/gemma-2-27b-it` |
| `claude-hf-gemma-2-9b` | `google/gemma-2-9b-it` |
| `claude-hf-phi-4` | `microsoft/phi-4` |
| `claude-hf-phi-3-medium` | `microsoft/Phi-3-medium-128k-instruct` |
| `claude-hf-command-r-plus` | `CohereForAI/c4ai-command-r-plus` |
| `claude-hf-yi-1.5-34b` | `01-ai/Yi-1.5-34B-Chat` |
| `claude-hf-nemotron-70b` | `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` |

HF Router auto-routes each call to whichever underlying provider (Together,
Fireworks, HF Inference, Hyperbolic, SambaNova, Novita, Nebius) currently has
the model live and cheapest.

### Conflict resolution

The same upstream id (e.g. `glm-4.6`) may be served by multiple providers. The
proxy disambiguates by request alias: `claude-glm-4.6` → Z.AI (upstream
`glm-4.6`), `claude-ollama-glm-4.6` → Ollama Cloud (upstream `glm-4.6:cloud`).
The same idea covers every `claude-hf-*`, `claude-ollama-*`, `claude-deepseek-*`,
and `claude-anthropic-*` pair.

## Endpoints

The proxy implements the Anthropic Messages REST surface:

| Method | Path | Handled |
| --- | --- | --- |
| `GET` | `/healthz` | local | proxy state, provider key flags, fallback table |
| `GET` | `/v1/models` | local | Anthropic-compatible catalog (84 default aliases) |
| `GET` | `/v1/models/{id}` | local | single-model lookup |
| `POST` | `/v1/messages` | forwarded | resolved per request body's `model` |
| `POST` | `/v1/messages/count_tokens` | local | deterministic character heuristic, returns `{"input_tokens": <n>}` |

## Claude Code CLI Integration

Claude Code (the official CLI) speaks the Anthropic Messages API and accepts
`ANTHROPIC_BASE_URL` / `ANTHROPIC_API_KEY` overrides. Point both at the proxy:

```sh
export ANTHROPIC_BASE_URL=http://127.0.0.1:8787
export ANTHROPIC_API_KEY=dummy-claude-model-proxy
export ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-ollama-qwen3-coder-next
export ANTHROPIC_DEFAULT_SONNET_MODEL=claude-ollama-qwen3-coder
export ANTHROPIC_DEFAULT_OPUS_MODEL=claude-ollama-gpt-oss-120b
export CLAUDE_CODE_SUBAGENT_MODEL=claude-ollama-qwen3-coder-next
claude
```

Tool-use payloads pass through as-is to Anthropic-Messages-compatible upstreams
(DeepSeek, Moonshot, GLM, Xiaomi, real Anthropic). OpenAI / Gemini / Qwen /
Ollama Cloud / HuggingFace Router go through the Chat Completions adapter,
which handles text, image, and streaming content — but tool-use blocks are
converted to text only. Heavy tool-driven workflows currently work best on the
Anthropic-Messages providers.

## macOS LaunchAgent

Claude Desktop can probe the gateway before the MCPB extension finishes
booting; this race produces a transient "Can't reach 127.0.0.1:8787" warning.
A LaunchAgent pre-warms the proxy so it's already listening:

```sh
npm run launch-agent:install
# Edit ~/.claude-model-proxy.env with the same keys you'd put in .env.
launchctl kickstart -k gui/$(id -u)/local.claude-model-proxy
curl http://127.0.0.1:8787/healthz
```

The MCPB extension can stay installed; when it detects the LaunchAgent already
holding port 8787 it reports the proxy as externally running and stops trying
to bind. Uninstall with:

```sh
npm run launch-agent:uninstall
```

## Testing

```sh
npm test
```

The suite is **48 Node `node:test` cases**, run against ephemeral
HTTP servers so no upstream credentials are required. Coverage includes:

- Per-provider routing for all 10 providers.
- Anthropic-shape pass-through.
- OpenAI-chat ↔ Anthropic JSON and SSE adapters.
- Smart Claude model resolution (date stripping, family fallback,
  Anthropic-key-aware fallback gating).
- Local `count_tokens` heuristic.
- `/v1/v1/...` path-duplication guard for `/v1`-suffixed base URLs.
- `REWRITE_RESPONSES` default and explicit opt-in / opt-out.
- Manifest ↔ code parity (versions, env-var keys, static MCPB tool definitions).

CI runs the same suite plus shell + JSON syntax checks on every push and pull
request (see `.github/workflows/ci.yml`).

## Security

- **All commits are SSH-signed.** This repository requires signed commits on
  `main`; `dev` is also signed. The signing key is published in the
  contributor's GitHub SSH keys list so GitHub renders a verified badge on
  every commit.
- **No secrets in source.** API keys are only read from environment variables
  or the MCPB install dialog. `.env` and `.env.*` are git-ignored except for
  the template; no secret ever lands in the repo.
- **No telemetry, no phone-home.** The proxy makes no network calls of its own
  beyond forwarding the client's request to the resolved upstream.
- **Bind address is loopback by default** (`127.0.0.1`). The proxy never
  listens on `0.0.0.0` unless you explicitly point `BASE_URL`/`PORT` at a
  routable interface.
- **Upstream API keys are scoped to their provider.** The proxy strips
  inbound `Authorization` and `x-api-key` headers and replaces them with the
  configured provider's key before forwarding — your gateway placeholder key
  never reaches an upstream provider.
- **Request body limit** (`REQUEST_BODY_LIMIT_BYTES`, default 50 MB)
  protects against memory exhaustion from malformed clients.
- **Hop-by-hop headers are stripped** in both directions.
- **No dynamic eval, no shell-out.** The proxy is pure Node stdlib plus
  `dotenv` for `.env` loading and `archiver` for the MCPB build script.

To report a security issue privately, see [SECURITY.md](SECURITY.md).

## Troubleshooting

### Model selection dropdown is empty in Claude Desktop

Click **Check again / Refresh** in the Gateway settings — the MCPB extension
needs a couple of seconds to bind port 8787 the first time. If the dropdown
stays empty:

```sh
curl http://127.0.0.1:8787/v1/models
```

If this returns JSON with `data` entries, ensure Developer Mode is on, the
Gateway API key field is non-empty (any placeholder), and the auth scheme is
`bearer`. If `curl` returns connection refused, the MCPB process did not start
— check Claude Desktop's extension log or run `npm start` in a terminal to
test the proxy standalone.

### "model not found" on `claude-haiku-4-5-20251001`

Claude Desktop emits dated aliases for internal calls (title generation,
summarisation). As of v0.2.0 the proxy strips the date suffix and routes the
request through the Claude family fallback when `ANTHROPIC_API_KEY` is empty.
Verify `DEFAULT_PROVIDER` and the relevant API key are set:

```sh
curl http://127.0.0.1:8787/healthz | jq '.providers, .claudeFamilyFallback'
```

### 404 at `/v1/v1/messages/count_tokens`

Fixed in v0.2.0: `count_tokens` is answered locally and never forwarded. If
you're still seeing this URL in logs, the running proxy is the old version —
restart the MCPB extension or kill the standalone process.

### HuggingFace request returns 401 / "Authentication required"

The HF token does not have inference access for the underlying provider HF
Router selected. Either re-issue the token with broader scope or override the
mapping to pin a different upstream:

```bash
ADVANCED_ENV='{"MODEL_MAP":"{\"claude-hf-llama-3.3-70b\":\"together/meta-llama/Llama-3.3-70B-Instruct\"}"}'
```

### HuggingFace 404 "model not found"

HF Router's catalog rotates. Check the live list:

```sh
curl https://router.huggingface.co/v1/models \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY"
```

Then pin via `MODEL_MAP` / `MODEL_ROUTES` override or simply switch to a
different `claude-hf-*` alias.

### Routes go to the wrong provider

`DEFAULT_PROVIDER` is only used for **unmapped** models. Built-in aliases
route via `MODEL_ROUTES` which the proxy merges with your overrides. If
`.env` defines `MODEL_ROUTES`, double-check you haven't accidentally
overwritten an entry. `/healthz` prints the effective routing table.

### `MODEL_MAP contains invalid JSON` on startup

A multi-line `.env` value isn't escaped properly. The proxy tolerates
whitespace and trailing commas inside JSON values, but each variable must
remain a single dotenv entry — either keep it on one logical line or escape
the newlines.

## Versioning

This project follows **Semantic Versioning 2.0.0**. The `manifest.json`,
`package.json`, and `server/index.mjs` `SERVER_VERSION` constant are always
kept in lockstep; the `tests/manifest exposes ... overrides` test enforces
this invariant.

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## Project Layout

```
.
├── manifest.json              # MCPB extension manifest (v0.3.0)
├── proxy.mjs                  # HTTP gateway proxy and provider adapters
├── server/index.mjs           # MCP stdio server hosting the proxy
├── scripts/                   # Build, LaunchAgent, and Node helper scripts
│   ├── build-mcpb.mjs         # Bundles the MCPB .zip
│   ├── ensure-node.sh         # macOS Node bootstrapping
│   ├── install-launch-agent.mjs
│   ├── run-launch-agent.sh
│   └── uninstall-launch-agent.mjs
├── srcs/                      # README screenshots and images
├── test/proxy.test.mjs        # Node test suite (48 cases)
├── start.sh                   # Standalone POSIX launcher with PID file
├── .env.example               # Annotated configuration template
├── .github/workflows/ci.yml   # CI: lint, test, build
├── CHANGELOG.md               # Release notes
├── CONTRIBUTING.md            # Contributor guide
├── SECURITY.md                # Vulnerability reporting
└── LICENSE                    # MIT
```

Generated artefacts (`dist/`), `.env` files, logs (`*.log`), PID files
(`*.pid`), editor metadata, and `node_modules/` are git-ignored.

## License

Released under the [MIT License](LICENSE). © Siddhartha Kumar.
