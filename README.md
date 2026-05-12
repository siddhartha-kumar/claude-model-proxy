# Claude Model Proxy

A local HTTP proxy that lets Claude Desktop's **Gateway / third-party inference**
feature talk to Ollama Cloud (Turbo), HuggingFace Inference Router, DeepSeek,
Moonshot/Kimi, Z.AI GLM, Xiaomi MiMo, OpenAI, Gemini, Qwen/DashScope, or real
Anthropic — all routed by the model name Claude Desktop sends.

It also smooths over the awkward bits:

- **Anthropic-shape ↔ OpenAI-shape adapter** for OpenAI / Gemini / Qwen / Ollama
  Cloud (JSON + streaming SSE).
- **Smart model resolution** — Claude Desktop's internal calls like
  `claude-haiku-4-5-20251001` (the dated alias) are normalised, and when
  `ANTHROPIC_API_KEY` isn't set the Haiku/Sonnet/Opus families are silently
  redirected to configurable Ollama Cloud fallbacks. So a one-key Ollama-Cloud
  setup "just works" with everything Claude Desktop does behind the scenes
  (title generation, token counting, etc.).
- **Local `/v1/messages/count_tokens`** — answered with a fast heuristic so the
  proxy doesn't have to forward an Anthropic-only endpoint to an
  OpenAI-compatible upstream that doesn't implement it.
- **Anthropic-compatible `/v1/models`** with `id`, `type`, `display_name`, and
  `created_at`, so the gateway's model dropdown auto-populates.
- **Bundled as an MCPB extension** for Claude Desktop so the proxy starts and
  stops with the app on Windows and macOS.

## Quick start (5 minutes, Ollama Cloud only)

This is the path most users want: no Anthropic credit card needed.

1. Get a free Ollama Cloud key at
   [ollama.com/settings/keys](https://ollama.com/settings/keys).
2. Build the MCPB:

   ```sh
   npm install
   npm run build:mcpb
   ```

   Output: `dist/claude-model-proxy-0.3.0.mcpb`.

3. In Claude Desktop: **Settings → Extensions / Connectors → Advanced settings
   → Install Extension** → pick the `.mcpb`. In the install dialog:

   | Field | Value |
   | --- | --- |
   | Gateway Base URL | `http://127.0.0.1:8787` |
   | Local Proxy Port | `8787` |
   | Default Provider | `ollama` |
   | Ollama Cloud Base URL | `https://ollama.com/v1` (default) |
   | Ollama Cloud API Key | *your key* |
   | HuggingFace Router Base URL | `https://router.huggingface.co/v1` (default) |
   | HuggingFace API Token | *optional — fill in if you also want `claude-hf-*` models* |
   | Claude Haiku Fallback Alias | `claude-ollama-qwen3-coder-next` (default) |
   | Claude Sonnet Fallback Alias | `claude-ollama-qwen3-coder` (default) |
   | Claude Opus Fallback Alias | `claude-ollama-gpt-oss-120b` (default) |
   | DeepSeek / Moonshot keys | *blank* |
   | Advanced JSON | `{}` |

4. **Settings → Developer Mode → Third-party inference → Gateway**:

   | Field | Value |
   | --- | --- |
   | Provider | `Gateway` |
   | Gateway base URL | `http://127.0.0.1:8787` |
   | Gateway API key | any non-empty placeholder (e.g. `dummy-claude-model-proxy`) |
   | Gateway auth scheme | `bearer` |
   | Model list | *Fetch from gateway* — the proxy auto-populates 84 models |

5. Open a new chat, pick e.g. `claude-ollama-qwen3-coder` (Ollama) or
   `claude-hf-llama-3.3-70b` (HuggingFace), and start coding.

   Anything Claude Desktop sends in the background with a `claude-haiku-*` /
   `claude-sonnet-*` / `claude-opus-*` model — including dated variants like
   `claude-haiku-4-5-20251001` — is auto-routed to the configured Ollama
   fallback, so you don't need an Anthropic key for the app to function.

## Adding HuggingFace alongside Ollama

The HuggingFace Inference Router is a hosted, OpenAI-compatible endpoint at
`https://router.huggingface.co/v1` that auto-routes to whichever underlying
inference provider currently has the model live (Together, Fireworks, HF
Inference, Hyperbolic, SambaNova, Novita, Nebius, …). One HF token gives you
all of them.

1. Create a token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   (a read-only fine-grained token is enough — no special scopes needed).
2. Paste it into the MCPB install dialog's **HuggingFace API Token** field
   (or set `HUGGINGFACE_API_KEY` / `HF_API_KEY` / `HF_TOKEN` in `.env` for
   standalone mode). The Ollama key can stay set at the same time.
3. The model dropdown in Claude Desktop now shows `claude-hf-*` aliases
   alongside `claude-ollama-*` ones — pick whichever you want per chat.
   Streaming, system messages, and image content all work the same way.

To make the auto-fallback for `claude-haiku-*` / `claude-sonnet-*` /
`claude-opus-*` use HuggingFace instead of Ollama, override the fallback
fields:

| Claude family | Suggested HF alias |
| --- | --- |
| Haiku | `claude-hf-llama-3.1-8b` |
| Sonnet | `claude-hf-qwen-2.5-coder-32b` |
| Opus | `claude-hf-llama-3.1-405b` |

## Standalone (no MCPB)

```sh
cp .env.example .env
# Edit .env — at minimum set OLLAMA_API_KEY (or whichever provider you'll use).
npm install
npm start
```

The proxy logs a startup banner showing every configured provider with a
checkmark next to the ones that have API keys, plus the active Claude family
fallbacks. The listening URL (`http://127.0.0.1:8787` by default) is what you
plug into Claude Desktop's gateway settings.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
notepad .env
# After saving, load .env into the current PowerShell session:
Get-Content .env | Where-Object { $_ -match '^\s*[^#].+=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}
npm start
```

### Windows cmd.exe

```bat
copy .env.example .env
notepad .env
set OLLAMA_API_KEY=...
npm start
```

## Model routing table

| Claude alias (request) | Provider | Upstream id |
| --- | --- | --- |
| `claude-haiku-4-5`, `claude-sonnet-4-5`, `claude-sonnet-4-6`, `claude-opus-4-1`, `claude-opus-4-7` | Anthropic (or family fallback if no key) | same name |
| `claude-haiku-4-5-20251001` and any dated `claude-{haiku,sonnet,opus}-*-YYYYMMDD` | Anthropic if key present, otherwise the Claude family fallback alias | resolved |
| `claude-deepseek-v4-flash`, `claude-deepseek-v4-pro` | DeepSeek | `deepseek-v4-flash`, `deepseek-v4-pro` |
| `claude-kimi-k2.6` | Moonshot | `kimi-k2.6` |
| `claude-glm-4.5-air`, `claude-glm-4.6`, `claude-glm-4.7`, `claude-glm-5`, `claude-glm-5.1` | Z.AI | matching `glm-*` |
| `claude-mimo-v2-flash`, `claude-mimo-v2-pro`, `claude-mimo-v2.5-pro`, `claude-mimo-v2-omni` | Xiaomi MiMo | matching `mimo-*` |
| `claude-gpt-5.5`, `claude-gpt-5.4`, `claude-gpt-5.4-mini` | OpenAI | matching `gpt-*` |
| `claude-gemini-2.0-flash`, `claude-gemini-2.5-flash`, `claude-gemini-2.5-pro`, `claude-gemini-3-flash-preview`, `claude-gemini-3.1-flash-lite-preview`, `claude-gemini-3.1-pro-preview` | Gemini | matching `gemini-*` |
| `claude-qwen-flash`, `claude-qwen-plus`, `claude-qwen-max` | Qwen/DashScope | matching `qwen-*` |
| `claude-ollama-gpt-oss-20b` | Ollama Cloud | `gpt-oss:20b-cloud` |
| `claude-ollama-gpt-oss-120b` | Ollama Cloud | `gpt-oss:120b-cloud` |
| `claude-ollama-deepseek-v3.1` | Ollama Cloud | `deepseek-v3.1:671b-cloud` |
| `claude-ollama-deepseek-v3.2` | Ollama Cloud | `deepseek-v3.2:cloud` |
| `claude-ollama-deepseek-v4-flash` *(short: `claude-dsv4-flash`)* | Ollama Cloud | `deepseek-v4-flash:cloud` |
| `claude-ollama-deepseek-v4-pro` *(short: `claude-dsv4-pro`)* | Ollama Cloud | `deepseek-v4-pro:cloud` |
| `claude-ollama-qwen3-coder` | Ollama Cloud | `qwen3-coder:480b-cloud` |
| `claude-ollama-qwen3-coder-next` | Ollama Cloud | `qwen3-coder-next:cloud` |
| `claude-ollama-qwen3-vl`, `claude-ollama-qwen3-vl-instruct` | Ollama Cloud | `qwen3-vl:235b-cloud`, `qwen3-vl:235b-instruct-cloud` |
| `claude-ollama-qwen3-next` | Ollama Cloud | `qwen3-next:80b-cloud` |
| `claude-ollama-qwen3.5` | Ollama Cloud | `qwen3.5:cloud` |
| `claude-ollama-kimi-k2` | Ollama Cloud | `kimi-k2:1t-cloud` |
| `claude-ollama-kimi-k2-thinking` | Ollama Cloud | `kimi-k2-thinking:cloud` |
| `claude-ollama-kimi-k2.6` | Ollama Cloud | `kimi-k2.6:cloud` |
| `claude-ollama-glm-4.6`, `claude-ollama-glm-4.7`, `claude-ollama-glm-5` | Ollama Cloud | matching `glm-*:cloud` |
| `claude-ollama-glm-5.1` *(short: `claude-glm51`)* | Ollama Cloud | `glm-5.1:cloud` |
| `claude-ollama-minimax-m2`, `…-m2.1`, `…-m2.5`, `…-m2.7` | Ollama Cloud | matching `minimax-*:cloud` |
| `claude-ollama-nemotron-3-nano`, `claude-ollama-nemotron-3-super` | Ollama Cloud | `nemotron-3-nano:30b-cloud`, `nemotron-3-super:cloud` |
| `claude-ollama-devstral-small-2`, `claude-ollama-ministral-3` | Ollama Cloud | `devstral-small-2:24b-cloud`, `ministral-3:8b-cloud` |
| `claude-ollama-gemma4-31b` | Ollama Cloud | `gemma4:31b-cloud` |
| `claude-ollama-gemini-3-flash-preview` | Ollama Cloud | `gemini-3-flash-preview:cloud` |
| `claude-ollama-rnj-1` | Ollama Cloud | `rnj-1:8b-cloud` |
| `claude-hf-llama-3.3-70b` | HuggingFace Router | `meta-llama/Llama-3.3-70B-Instruct` |
| `claude-hf-llama-3.1-405b` | HuggingFace Router | `meta-llama/Llama-3.1-405B-Instruct` |
| `claude-hf-llama-3.1-70b` | HuggingFace Router | `meta-llama/Llama-3.1-70B-Instruct` |
| `claude-hf-llama-3.1-8b` | HuggingFace Router | `meta-llama/Llama-3.1-8B-Instruct` |
| `claude-hf-qwen-2.5-72b` | HuggingFace Router | `Qwen/Qwen2.5-72B-Instruct` |
| `claude-hf-qwen-2.5-coder-32b` | HuggingFace Router | `Qwen/Qwen2.5-Coder-32B-Instruct` |
| `claude-hf-qwen-3-coder-480b` | HuggingFace Router | `Qwen/Qwen3-Coder-480B-A35B-Instruct` |
| `claude-hf-qwen-3-235b` | HuggingFace Router | `Qwen/Qwen3-235B-A22B` |
| `claude-hf-deepseek-v3` | HuggingFace Router | `deepseek-ai/DeepSeek-V3` |
| `claude-hf-deepseek-v3.1` | HuggingFace Router | `deepseek-ai/DeepSeek-V3.1` |
| `claude-hf-deepseek-r1` | HuggingFace Router | `deepseek-ai/DeepSeek-R1` |
| `claude-hf-deepseek-r1-distill-llama-70b` | HuggingFace Router | `deepseek-ai/DeepSeek-R1-Distill-Llama-70B` |
| `claude-hf-mistral-large-2411` | HuggingFace Router | `mistralai/Mistral-Large-Instruct-2411` |
| `claude-hf-mixtral-8x7b` | HuggingFace Router | `mistralai/Mixtral-8x7B-Instruct-v0.1` |
| `claude-hf-mistral-7b` | HuggingFace Router | `mistralai/Mistral-7B-Instruct-v0.3` |
| `claude-hf-gemma-2-27b` | HuggingFace Router | `google/gemma-2-27b-it` |
| `claude-hf-gemma-2-9b` | HuggingFace Router | `google/gemma-2-9b-it` |
| `claude-hf-phi-4` | HuggingFace Router | `microsoft/phi-4` |
| `claude-hf-phi-3-medium` | HuggingFace Router | `microsoft/Phi-3-medium-128k-instruct` |
| `claude-hf-command-r-plus` | HuggingFace Router | `CohereForAI/c4ai-command-r-plus` |
| `claude-hf-yi-1.5-34b` | HuggingFace Router | `01-ai/Yi-1.5-34B-Chat` |
| `claude-hf-nemotron-70b` | HuggingFace Router | `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` |

Conflict resolution: the same upstream id (e.g. `glm-4.6`) can be served by both
Z.AI and Ollama Cloud. The proxy disambiguates by request alias, so
`claude-glm-4.6` always goes to Z.AI and `claude-ollama-glm-4.6` always goes to
Ollama (as `glm-4.6:cloud`). Same idea for HF Router — every `claude-hf-*`
alias routes to the HuggingFace provider, no matter what other providers are
configured.

The live source of truth is `curl http://127.0.0.1:8787/v1/models` against a
running proxy.

## Configuration reference

All settings come from environment variables. Standalone runs read `.env`
automatically (via `dotenv`); the MCPB install dialog writes the same
variables for you.

### Proxy basics

| Variable | Default | Notes |
| --- | --- | --- |
| `BASE_URL` | `http://127.0.0.1:8787` | URL Claude Desktop calls. |
| `PORT` | `8787` | Local listen port. |
| `DEFAULT_PROVIDER` | `deepseek` | Fallback for unmapped models. Set to `ollama` for an Ollama-only setup. |
| `REWRITE_RESPONSES` | `true` | Rewrite upstream model ids back to the Claude alias in responses. |
| `DEBUG_PROXY` | `false` | Verbose request/response logging — leave off in production; request bodies can be large. |
| `REQUEST_BODY_LIMIT_BYTES` | `52428800` (50 MB) | Maximum incoming request size. |

### Claude family fallback

These are used **only** when `ANTHROPIC_API_KEY` is empty. Any incoming
`claude-haiku-*`, `claude-sonnet-*`, or `claude-opus-*` (including dated
variants) is rewritten to the alias below before routing.

| Variable | Default |
| --- | --- |
| `CLAUDE_HAIKU_MODEL` | `claude-ollama-qwen3-coder-next` |
| `CLAUDE_SONNET_MODEL` | `claude-ollama-qwen3-coder` |
| `CLAUDE_OPUS_MODEL` | `claude-ollama-gpt-oss-120b` |

The value must be a Claude alias that exists in `MODEL_MAP`. Useful overrides:
point Sonnet at `claude-deepseek-v4-pro`, Opus at `claude-kimi-k2.6`, etc.

### Provider credentials

| Variable | Default base URL | Notes |
| --- | --- | --- |
| `OLLAMA_API_KEY` | `https://ollama.com/v1` (`OLLAMA_BASE_URL`) | Get at [ollama.com/settings/keys](https://ollama.com/settings/keys). |
| `HUGGINGFACE_API_KEY` (aliases `HF_API_KEY`, `HF_TOKEN`) | `https://router.huggingface.co/v1` (`HUGGINGFACE_BASE_URL`, `HF_BASE_URL`) | Get at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens). HF Router auto-picks the underlying inference provider. |
| `DEEPSEEK_API_KEY` | `https://api.deepseek.com/anthropic` | Anthropic-shape upstream. |
| `MOONSHOT_API_KEY` (alias `KIMI_API_KEY`) | `https://api.moonshot.cn/anthropic` | Anthropic-shape upstream. |
| `GLM_API_KEY` (aliases `ZAI_API_KEY`, `ZHIPU_API_KEY`) | `https://api.z.ai/api/anthropic` | Anthropic-shape upstream. |
| `XIAOMI_API_KEY` (alias `MIMO_API_KEY`) | `https://api.xiaomimimo.com/anthropic` | Anthropic-shape upstream. |
| `OPENAI_API_KEY` | `https://api.openai.com/v1` | OpenAI Chat Completions. |
| `GEMINI_API_KEY` (alias `GOOGLE_API_KEY`) | `https://generativelanguage.googleapis.com/v1beta/openai` | OpenAI-compatible surface. |
| `QWEN_API_KEY` (alias `DASHSCOPE_API_KEY`) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI-compatible surface. |
| `ANTHROPIC_API_KEY` | `https://api.anthropic.com` | Real Anthropic, sent as `x-api-key`. |

Every provider also supports a `_BASE_URL` override (e.g. `DEEPSEEK_BASE_URL`)
if you're behind a custom gateway.

### Advanced routing overrides

Three optional env vars, each accepting a JSON object or a `from=to,from=to`
list. Merged on top of the built-in defaults.

- `MODEL_MAP` — Claude alias → upstream id.
- `MODEL_ALIASES` — upstream id → Claude alias for response rewriting.
- `MODEL_ROUTES` — model name (alias **or** upstream id) → provider name.

For MCPB installs the **Optional Advanced Settings JSON** field accepts a
single blob with the same env-var keys:

```json
{
  "GLM_API_KEY": "...",
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "DEBUG_PROXY": "true"
}
```

## Endpoints

The proxy speaks the Anthropic Messages REST API. Claude Desktop hits these:

- `GET /v1/models` — Anthropic-compatible catalog, populated from `MODEL_MAP`.
- `GET /v1/models/{id}` — single model lookup.
- `POST /v1/messages` — chat (forwarded to the resolved provider).
- `POST /v1/messages/count_tokens` — **handled locally** by a character-based
  heuristic estimate. Returns `{"input_tokens": <n>}`.
- `GET /healthz` — proxy state, provider key flags, fallback table.

## Troubleshooting

**"Model selection dropdown is empty in Claude Desktop"**
Click **Check again / Refresh** in the Gateway settings. The MCPB extension
needs a couple of seconds to bind port 8787. If the dropdown stays empty:

```sh
curl http://127.0.0.1:8787/v1/models
```

If that returns JSON with `data` entries, ensure Developer Mode is on, the
Gateway API key field is non-empty (any placeholder is fine), and the auth
scheme is `bearer`. If it returns connection refused, the MCPB process didn't
start — check Claude Desktop's extension log, or run `npm start` in a terminal
to test standalone.

**"model not found" 404 from Ollama on `claude-haiku-4-5-20251001`**
Pre-fix symptom: Claude Desktop's internal title-generator was forwarded
unchanged to Ollama Cloud, which rejected it. As of v0.2.0 the proxy strips
the date suffix and, when `ANTHROPIC_API_KEY` is empty, routes the request to
the Claude family fallback (`claude-ollama-qwen3-coder-next` for haiku by
default). If you're still seeing this after upgrading, make sure
`DEFAULT_PROVIDER=ollama` and `OLLAMA_API_KEY` is set; the family fallback
also needs a valid key for the destination provider.

**404 at `/v1/v1/messages/count_tokens`**
Pre-fix symptom: when `OLLAMA_BASE_URL` ended in `/v1` and Claude Desktop
called `/v1/messages/count_tokens`, the path was concatenated to
`/v1/v1/messages/count_tokens`. The proxy now answers `count_tokens` locally
and never forwards it.

**`MODEL_MAP contains invalid JSON`** at startup
Your `.env` line wraps onto multiple lines without escaping. The proxy
tolerates whitespace and trailing commas inside the JSON, but the value must
still be a single dotenv entry. Either put it on one line or escape the
newlines.

**Multiple providers but everything goes to one of them**
`DEFAULT_PROVIDER` is only used for unmapped models. Routes for the built-in
aliases come from `MODEL_ROUTES`, which the proxy merges with your overrides.
If you've set `MODEL_ROUTES` in `.env`, double-check that you haven't
overwritten the entry you care about. `curl http://127.0.0.1:8787/healthz`
prints the effective table.

**HuggingFace request 401 / "Authentication required"**
Your HF token doesn't have inference access for the underlying provider HF
Router picked. Either re-generate the token with broader scopes (a
fine-grained read token usually works) or switch to a different `claude-hf-*`
alias — HF Router maps each model to a specific upstream provider and not
every token has access to every provider's commercial endpoints.

**HuggingFace 404 "model not found"**
The HF Router catalog rotates. Hit `curl
https://router.huggingface.co/v1/models -H "Authorization: Bearer $HF_TOKEN"`
to see the live list and add an override:

```sh
ADVANCED_ENV='{"MODEL_MAP":"{\"claude-hf-my-model\":\"vendor/Some-Model\"}",
               "MODEL_ROUTES":"{\"claude-hf-my-model\":\"huggingface\"}"}'
```

## MCP tool: `model_proxy_status`

The MCPB exposes one MCP tool that lets you ask Claude about the running
proxy from inside a chat:

> "Use the Model proxy status tool to check whether Claude Model Proxy is
> running."

It returns `listening`, `defaultProvider`, the provider table with
`hasApiKey` flags, the full `modelMap` / `modelAliases` / `modelRoutes`,
and the active `claudeFamilyFallback` table.

## Claude Code (CLI) integration

Claude Code can use this proxy through its Anthropic-compatible env vars.
Start the proxy first, then in the terminal where you run `claude`:

```sh
export ANTHROPIC_BASE_URL=http://127.0.0.1:8787
export ANTHROPIC_API_KEY=dummy-claude-model-proxy
export ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-ollama-qwen3-coder-next
export ANTHROPIC_DEFAULT_SONNET_MODEL=claude-ollama-qwen3-coder
export ANTHROPIC_DEFAULT_OPUS_MODEL=claude-ollama-gpt-oss-120b
export CLAUDE_CODE_SUBAGENT_MODEL=claude-ollama-qwen3-coder-next
claude
```

Tool-use payloads pass through as-is to Anthropic-Messages-compatible
providers (DeepSeek, Moonshot, GLM, Xiaomi, real Anthropic). On OpenAI / Gemini
/ Qwen / Ollama Cloud / HuggingFace Router the basic Chat Completions adapter
handles text + images + streaming text deltas; heavy tool-driven workflows
still work best on the Anthropic-Messages providers above.

## macOS LaunchAgent (avoid the startup warning)

Claude Desktop can probe the gateway before the MCPB extension finishes
starting. To pre-warm the proxy as a macOS LaunchAgent:

```sh
npm run launch-agent:install
# Edit ~/.claude-model-proxy.env with the same keys you'd put in .env.
launchctl kickstart -k gui/$(id -u)/local.claude-model-proxy
curl http://127.0.0.1:8787/healthz
```

The MCPB extension can stay installed; if it sees the LaunchAgent already
holding port 8787 it reports the proxy as externally running instead of
treating the port conflict as a failure. Remove with:

```sh
npm run launch-agent:uninstall
```

## Project layout

```text
.
├── manifest.json              # MCPB extension manifest
├── proxy.mjs                  # HTTP gateway proxy and provider adapters
├── server/index.mjs           # MCP stdio server that hosts the proxy
├── scripts/                   # Build, launchd, and Node helper scripts
├── srcs/                      # README screenshots and images
├── test/proxy.test.mjs        # Node test suite (46 cases)
├── start.sh                   # Standalone launcher (POSIX)
└── .env.example               # Configuration template
```

Generated files under `dist/`, local `.env` files, logs, editor files, and
dependencies are ignored by `.gitignore`.

## Notes

- DeepSeek, Moonshot/Kimi, GLM, Xiaomi MiMo, and Anthropic are treated as
  Anthropic Messages-compatible upstreams (body passed through).
- OpenAI, Gemini, Qwen, Ollama Cloud, and HuggingFace Router go through the
  OpenAI Chat Completions adapter (text + image content + streaming text
  deltas; Anthropic tool-use blocks are converted to text only).
- Ollama Cloud's OpenAI-compatible surface is officially experimental.
  If a future Ollama release breaks the chunk shape we decode, drop `stream`
  to `false` for a quick workaround.
- HuggingFace Router fronts a rotating set of underlying providers (Together,
  Fireworks, HF Inference, Hyperbolic, SambaNova, Novita, Nebius, …). One
  token gives you all of them, and HF picks the cheapest live one for each
  call. Catalog changes happen often; pin a specific model via `MODEL_MAP`
  override if you need stability.
