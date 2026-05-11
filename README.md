# Claude model proxy

Claude Desktop can point its gateway at this proxy while requests are routed by
model name to DeepSeek, Moonshot/Kimi, GLM, Xiaomi MiMo, OpenAI, Gemini, Qwen,
Ollama Cloud (Turbo), or Anthropic upstreams. The default mappings are:

| Claude model | Upstream provider | Upstream model |
| --- | --- | --- |
| `claude-haiku-4-5` | Anthropic | `claude-haiku-4-5` |
| `claude-sonnet-4-6` | Anthropic | `claude-sonnet-4-6` |
| `claude-opus-4-7` | Anthropic | `claude-opus-4-7` |
| `claude-deepseek-v4-flash` | DeepSeek | `deepseek-v4-flash` |
| `claude-deepseek-v4-pro` | DeepSeek | `deepseek-v4-pro` |
| `claude-kimi-k2.6` | Moonshot/Kimi | `kimi-k2.6` |
| `claude-glm-4.5-air` | GLM | `glm-4.5-air` |
| `claude-glm-4.7` | GLM | `glm-4.7` |
| `claude-glm-5.1` | GLM | `glm-5.1` |
| `claude-mimo-v2-flash` | Xiaomi MiMo | `mimo-v2-flash` |
| `claude-mimo-v2-pro` | Xiaomi MiMo | `mimo-v2-pro` |
| `claude-mimo-v2.5-pro` | Xiaomi MiMo | `mimo-v2.5-pro` |
| `claude-qwen-flash` | Qwen | `qwen-flash` |
| `claude-qwen-plus` | Qwen | `qwen-plus` |
| `claude-qwen-max` | Qwen | `qwen-max` |
| `claude-gpt-5.4-mini` | OpenAI | `gpt-5.4-mini` |
| `claude-gpt-5.4` | OpenAI | `gpt-5.4` |
| `claude-gpt-5.5` | OpenAI | `gpt-5.5` |
| `claude-gemini-3.1-flash-lite-preview` | Gemini | `gemini-3.1-flash-lite-preview` |
| `claude-gemini-3-flash-preview` | Gemini | `gemini-3-flash-preview` |
| `claude-gemini-3.1-pro-preview` | Gemini | `gemini-3.1-pro-preview` |
| `claude-ollama-gpt-oss-20b` | Ollama Cloud | `gpt-oss:20b` |
| `claude-ollama-gpt-oss-120b` | Ollama Cloud | `gpt-oss:120b` |
| `claude-ollama-deepseek-v3.1` | Ollama Cloud | `deepseek-v3.1:671b` |
| `claude-ollama-deepseek-v3.2` | Ollama Cloud | `deepseek-v3.2` |
| `claude-ollama-qwen3-coder` | Ollama Cloud | `qwen3-coder:480b` |
| `claude-ollama-qwen3-coder-next` | Ollama Cloud | `qwen3-coder-next` |
| `claude-ollama-qwen3-vl` | Ollama Cloud | `qwen3-vl:235b` |
| `claude-ollama-qwen3-next` | Ollama Cloud | `qwen3-next:80b` |
| `claude-ollama-qwen3.5` | Ollama Cloud | `qwen3.5:122b` |
| `claude-ollama-kimi-k2` | Ollama Cloud | `kimi-k2:1t` |
| `claude-ollama-kimi-k2-thinking` | Ollama Cloud | `kimi-k2-thinking` |
| `claude-ollama-kimi-k2.6` | Ollama Cloud | `kimi-k2.6` |
| `claude-ollama-glm-4.6` | Ollama Cloud | `glm-4.6` |
| `claude-ollama-glm-4.7` | Ollama Cloud | `glm-4.7` |
| `claude-ollama-glm-5` | Ollama Cloud | `glm-5` |
| `claude-ollama-glm-5.1` | Ollama Cloud | `glm-5.1` |
| `claude-ollama-minimax-m2` | Ollama Cloud | `minimax-m2` |
| `claude-ollama-minimax-m2.1` | Ollama Cloud | `minimax-m2.1` |
| `claude-ollama-minimax-m2.5` | Ollama Cloud | `minimax-m2.5` |
| `claude-ollama-minimax-m2.7` | Ollama Cloud | `minimax-m2.7` |
| `claude-ollama-nemotron-3-nano` | Ollama Cloud | `nemotron-3-nano:30b` |
| `claude-ollama-nemotron-3-super` | Ollama Cloud | `nemotron-3-super:120b` |
| `claude-ollama-devstral-small-2` | Ollama Cloud | `devstral-small-2:24b` |
| `claude-ollama-ministral-3` | Ollama Cloud | `ministral-3:8b` |
| `claude-ollama-gemma4-26b` | Ollama Cloud | `gemma4:26b` |
| `claude-ollama-gemma4-31b` | Ollama Cloud | `gemma4:31b` |
| `claude-ollama-gemini-3-flash-preview` | Ollama Cloud | `gemini-3-flash-preview` |
| `claude-ollama-rnj-1` | Ollama Cloud | `rnj-1:8b` |

The `Claude model` value is both the request model and the default response
alias. When multiple request aliases share one upstream model, responses are
rewritten back to the request alias used for that call. Provider aliases use
`claude-` plus the actual upstream model name. The original
Claude model names `claude-haiku-4-5`, `claude-sonnet-4-6`, and
`claude-opus-4-7` are sent to the Anthropic provider directly. OpenAI, Gemini,
Qwen, and Ollama Cloud models are not supported by the Anthropic provider.

Ollama Cloud (Turbo) hosts the models listed above on ollama.com and does **not**
require a local Ollama install. Sign in at
[ollama.com/settings/keys](https://ollama.com/settings/keys) to mint
`OLLAMA_API_KEY`. The `glm-4.6` upstream name is served by both Z.AI and
Ollama; the proxy disambiguates by the request alias, so
`claude-glm-4.6` always goes to Z.AI and `claude-ollama-glm-4.6` always goes to
Ollama.

## Requirements

- Node.js 18 or newer
- Claude Desktop with Gateway / third-party inference configuration
- At least one provider API key for the models you plan to use

## Run

### macOS / Linux

```sh
cp .env.example .env
# Edit .env and fill in the provider keys you need.
set -a
. ./.env
set +a
npm start
```

If `npm start` fails with `env: node: No such file or directory`, use the
included launcher instead. It uses the default `node` on `PATH`; if Node.js 18+
is not available on macOS and Homebrew is installed, it attempts `brew install
node` automatically.

```sh
export DEEPSEEK_API_KEY="sk-..."
export MOONSHOT_API_KEY="sk-..."
export GLM_API_KEY="sk-..."
export XIAOMI_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."
export OLLAMA_API_KEY="..."
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
./start.sh
```

### Windows

`start.sh` is a POSIX script and is not needed on Windows. Run the proxy
directly with Node, either in PowerShell or in `cmd`. Copy `.env.example` to
`.env` and fill in the keys you actually use, then start the proxy:

PowerShell (recommended):

```powershell
Copy-Item .env.example .env
# Edit .env and fill in only the provider keys you actually need.
# Then export the file into the current PowerShell session:
Get-Content .env | Where-Object { $_ -match '^\s*[^#].+=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}
npm start
```

`cmd.exe`:

```bat
copy .env.example .env
notepad .env
:: After saving the file, set the keys you need, then start the proxy:
set OLLAMA_API_KEY=...
set DEEPSEEK_API_KEY=sk-...
npm start
```

The proxy logs the listening URL on startup. Keep that terminal open while you
use Claude Code / Claude Desktop in another window. To run as a background
process, either install the MCPB extension (Claude Desktop will manage the
process for you — see below) or use a Windows-native supervisor such as
[NSSM](https://nssm.cc/) pointed at `node proxy.mjs`.

`start.sh` starts the proxy in the background by default and writes
`claude-model-proxy.pid` plus `claude-model-proxy.log`. Common commands:

```sh
./start.sh status
./start.sh stop
./start.sh restart
./start.sh foreground
```

Set `CLAUDE_MODEL_PROXY_AUTO_INSTALL_NODE=0` before running `./start.sh` to
disable automatic Homebrew install attempts.

The proxy listens locally on the same URL you should configure as the gateway
base URL:

```text
http://127.0.0.1:8787
```

## Configuration

Environment variables:

- `BASE_URL`: gateway-facing base URL. Default: `http://127.0.0.1:8787`.
- `PORT`: local listen port. Default: `8787`.
- `ADVANCED_ENV`: JSON object used by the extension installer for optional
  provider keys and advanced overrides.
- `DEEPSEEK_BASE_URL`: DeepSeek-compatible API base URL. Default:
  `https://api.deepseek.com/anthropic`.
- `DEEPSEEK_API_KEY`: DeepSeek API key.
- `MOONSHOT_BASE_URL`: Moonshot/Kimi-compatible API base URL. Default:
  `https://api.moonshot.cn/anthropic`.
- `MOONSHOT_API_KEY`: Moonshot/Kimi API key.
- `GLM_BASE_URL`: Z.AI/GLM-compatible API base URL. Default:
  `https://api.z.ai/api/anthropic`.
- `GLM_API_KEY`: Z.AI/GLM API key. `ZAI_API_KEY` and `ZHIPU_API_KEY` are also
  accepted aliases.
- `XIAOMI_BASE_URL`: Xiaomi MiMo-compatible API base URL. Default:
  `https://api.xiaomimimo.com/anthropic`.
- `XIAOMI_API_KEY`: Xiaomi MiMo API key. `MIMO_API_KEY` is also accepted.
- `ANTHROPIC_BASE_URL`: Anthropic Messages API base URL. Default:
  `https://api.anthropic.com`.
- `OPENAI_BASE_URL`: OpenAI Chat Completions API base URL. Default:
  `https://api.openai.com/v1`.
- `GEMINI_BASE_URL`: Gemini OpenAI-compatible API base URL. Default:
  `https://generativelanguage.googleapis.com/v1beta/openai`.
- `QWEN_BASE_URL`: Qwen/DashScope OpenAI-compatible API base URL. Default:
  `https://dashscope.aliyuncs.com/compatible-mode/v1`.
- `OLLAMA_BASE_URL`: Ollama Cloud OpenAI-compatible base URL. Default:
  `https://ollama.com/v1`. Do not change this unless you are routing through a
  custom Ollama-compatible gateway; the default points at hosted Ollama Cloud
  (Turbo) and does not require any local install.
- `OLLAMA_API_KEY`: Ollama Cloud API key from
  [ollama.com/settings/keys](https://ollama.com/settings/keys).
- `ANTHROPIC_API_KEY`: Anthropic API key. Sent as `x-api-key`.
- `OPENAI_API_KEY`: OpenAI API key.
- `GEMINI_API_KEY`: Gemini API key. `GOOGLE_API_KEY` is also accepted.
- `QWEN_API_KEY`: Qwen/DashScope API key (or `DASHSCOPE_API_KEY`).
- `MODEL_MAP`: request model name -> upstream model name. JSON object or
  `from=to,from2=to2`.
- `MODEL_ALIASES`: upstream model name -> Claude response alias. JSON object or
  `from=to,from2=to2`.
- `MODEL_ROUTES`: provider routing table. Keys may be either the upstream model
  name **or** the Claude request alias; the request-alias form wins, which is
  how Ollama Cloud's `claude-ollama-glm-4.6` and Z.AI's `claude-glm-4.6` can
  share the upstream id `glm-4.6` without collision. Provider names are
  `deepseek`, `moonshot`, `glm`, `xiaomi`, `openai`, `gemini`, `qwen`,
  `ollama`, and `anthropic`.
- `REWRITE_RESPONSES`: set to `false` to stop rewriting response model names.

Default mappings come baked into `proxy.mjs`. The table at the top of this
README is the canonical list, and `curl http://127.0.0.1:8787/v1/models`
against a running proxy is the live source of truth.

### Adding or pruning Ollama Cloud models

Ollama rotates its cloud catalog often. If a default alias 404s ("model not
found") or you want to add a model that isn't in the table, override
`MODEL_MAP` / `MODEL_ROUTES` via the MCPB *Optional Advanced Settings JSON*
field, or via the `ADVANCED_ENV` env var when running from a shell:

```sh
ADVANCED_ENV='{
  "MODEL_MAP": "{\"claude-ollama-my-new-model\":\"some-new-cloud-model:tag\"}",
  "MODEL_ROUTES": "{\"claude-ollama-my-new-model\":\"ollama\"}"
}'
```

Then add `claude-ollama-my-new-model` to Claude Desktop's gateway model list.
The proxy merges these on top of the built-in defaults — anything already in
the table keeps working.

## Health check

```sh
curl http://127.0.0.1:8787/healthz
```

## Ollama Cloud (Turbo) — no local install

Ollama Cloud hosts large open models on ollama.com so you can use them through
this proxy without running `ollama` locally. To enable it:

1. Sign in at [ollama.com](https://ollama.com/) and create an API key at
   [ollama.com/settings/keys](https://ollama.com/settings/keys).
2. Set `OLLAMA_API_KEY` for the proxy. In the MCPB installer the field is
   labelled "Ollama Cloud API Key". From the shell, add it to `.env` or export
   it before `npm start` / `node proxy.mjs`.
3. Use any of the `claude-ollama-*` aliases from the table above in Claude
   Desktop's gateway model list, or pass it to Claude Code with
   `--model claude-ollama-gpt-oss-120b`.

The proxy talks to `https://ollama.com/v1/chat/completions` over Ollama's
OpenAI-compatible surface. Streaming, text content, and image content all work.
Tool use is converted only at the text level — see the Claude Code section
below for the same caveat that applies to OpenAI, Gemini, and Qwen.

Quick sanity check (replace the key, keep the URL):

```sh
curl -X POST http://127.0.0.1:8787/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: dummy-claude-model-proxy" \
  -d '{
    "model": "claude-ollama-gpt-oss-20b",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "say hi in one word"}]
  }'
```

## Claude Code

Claude Code can use this proxy through its Anthropic-compatible environment
variables. Start the proxy first, then source the Claude Code client environment
in the terminal where you run `claude`:

```sh
cp .env.claude-code.example .env.claude-code
# Edit .env.claude-code if you want different model aliases.
set -a
. ./.env.claude-code
set +a
claude
```

The default Claude Code example maps its aliases to these proxy models:

```sh
ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-deepseek-v4-flash
ANTHROPIC_DEFAULT_SONNET_MODEL=claude-deepseek-v4-pro
ANTHROPIC_DEFAULT_OPUS_MODEL=claude-kimi-k2.6
CLAUDE_CODE_SUBAGENT_MODEL=claude-deepseek-v4-flash
ANTHROPIC_MODEL=sonnet
```

You can also start Claude Code with a specific proxy model directly:

```sh
ANTHROPIC_BASE_URL=http://127.0.0.1:8787 \
ANTHROPIC_API_KEY=dummy-claude-model-proxy \
claude --model claude-deepseek-v4-pro
```

To pin every Claude Code role at an Ollama Cloud model:

```sh
ANTHROPIC_BASE_URL=http://127.0.0.1:8787 \
ANTHROPIC_API_KEY=dummy-claude-model-proxy \
ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-ollama-gpt-oss-20b \
ANTHROPIC_DEFAULT_SONNET_MODEL=claude-ollama-qwen3-coder \
ANTHROPIC_DEFAULT_OPUS_MODEL=claude-ollama-gpt-oss-120b \
CLAUDE_CODE_SUBAGENT_MODEL=claude-ollama-gpt-oss-20b \
claude
```

On Windows in PowerShell:

```powershell
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:8787"
$env:ANTHROPIC_API_KEY = "dummy-claude-model-proxy"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "claude-ollama-gpt-oss-20b"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "claude-ollama-qwen3-coder"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "claude-ollama-gpt-oss-120b"
$env:CLAUDE_CODE_SUBAGENT_MODEL = "claude-ollama-gpt-oss-20b"
claude
```

On Windows in `cmd.exe`:

```bat
set ANTHROPIC_BASE_URL=http://127.0.0.1:8787
set ANTHROPIC_API_KEY=dummy-claude-model-proxy
set ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-ollama-gpt-oss-20b
set ANTHROPIC_DEFAULT_SONNET_MODEL=claude-ollama-qwen3-coder
set ANTHROPIC_DEFAULT_OPUS_MODEL=claude-ollama-gpt-oss-120b
set CLAUDE_CODE_SUBAGENT_MODEL=claude-ollama-gpt-oss-20b
claude
```

`ANTHROPIC_API_KEY` is only a non-empty client-side placeholder for this proxy.
Provider API keys still come from the proxy's `.env`, MCPB install settings, or
LaunchAgent environment file.

Claude Code works best with Anthropic Messages-compatible upstreams such as
DeepSeek, Moonshot/Kimi, GLM, Xiaomi MiMo, and Anthropic because tool-use
payloads are passed through as-is. OpenAI, Gemini, Qwen, and Ollama Cloud
routes use a basic Chat Completions adapter for text/image and streaming
responses; they are not a full Claude Code tool-use compatibility layer, so
heavy tool-driven workflows (file edits, shell, MCP servers) currently work
best on the Anthropic-Messages providers above. Plain chat / coding-Q&A flows
on Ollama Cloud work today.

## Claude Desktop extension

Build the installable MCPB extension:

```sh
npm run build:mcpb
```

The output is:

```text
dist/claude-model-proxy-0.1.0.mcpb
```

Install it in Claude Desktop from Settings -> Extensions / Connectors ->
Advanced settings -> Install Extension. During first installation, fill in the
gateway URL, local port, DeepSeek credentials, Moonshot/Kimi credentials, and
the **Ollama Cloud API Key** field. Leave any provider's key blank if you do
not want to use that provider. Optional providers and mapping overrides can be
supplied through the advanced JSON field.

The MCPB build runs the proxy as a Node-stdio MCP server, so the same `.mcpb`
file works on Windows and macOS. On Windows, Claude Desktop manages the proxy
process for you — you do not need to keep a separate terminal open with
`npm start` after installing the extension.

After the extension is installed, open Claude Desktop settings and configure
third-party inference as shown below. If the third-party inference or extension
controls are hidden, enable Developer Mode first.

![Claude Desktop gateway settings](srcs/claude-developer-mode.png)

Use these values:

- Provider: `Gateway`
- Gateway base URL: `http://127.0.0.1:8787`
- Gateway API key: any non-empty placeholder, for example
  `dummy-claude-model-proxy`
- Gateway auth scheme: `bearer`
- Model list: add the Claude-style request model names you want to expose, such
  as `claude-deepseek-v4-flash`, `claude-deepseek-v4-pro`,
  `claude-kimi-k2.6`, `claude-qwen-flash`, `claude-qwen-plus`,
  `claude-qwen-max`, or any of the Ollama Cloud aliases like
  `claude-ollama-gpt-oss-20b`, `claude-ollama-gpt-oss-120b`,
  `claude-ollama-qwen3-coder`, `claude-ollama-deepseek-v3.1`, and
  `claude-ollama-kimi-k2`

Provider API keys are configured in the extension installer or environment
variables, not in the Gateway API key field.

The extension exposes a `model_proxy_status` tool so you can inspect local proxy
status, providers, and model mappings from Claude.

In Claude Desktop settings, this appears under Tool permissions as
`Other tools -> Model proxy status`. If its permission is `Needs approval`,
Claude will ask before each tool call. The tool is annotated as read-only and
non-destructive, so new installs on clients that honor MCP annotations should be
able to default it to no approval; existing user permission overrides may need
to be changed once in settings. In a Claude chat, ask:

```text
Use the Model proxy status tool to check whether Claude Model Proxy is running.
```

or:

```text
Call model_proxy_status and tell me whether the proxy is listening and whether
API keys are configured.
```

The returned JSON includes `listening`, `error`, `external`, `localUrl`,
provider `hasApiKey` flags, and the active model mappings. You can also inspect
similar status from a terminal:

```sh
curl http://127.0.0.1:8787/healthz
```

If a brand-new chat says `model_proxy_status` is unavailable but the same
request works immediately on retry, Claude started the model response before it
had refreshed the MCPB tool list. The extension declares a fixed static tool
list in the bundle metadata and marks `model_proxy_status` as read-only so
clients can discover and approve it early. If the first already-started response
was built without tools, retry the request once or open the chat after Claude
Desktop has finished loading the extension. Keeping the proxy itself running as
a LaunchAgent also avoids the separate gateway-listening race described below.

## Avoid the startup warning

Claude Desktop can probe the gateway before the MCPB extension process has
finished starting. When that happens, Claude shows "Can't reach 127.0.0.1:8787"
until you click "Check again".

For a clean startup, run the proxy as a macOS LaunchAgent so it is already
listening before Claude starts:

```sh
npm run launch-agent:install
```

The installer creates `~/.claude-model-proxy.env`. Put the same provider keys in
that file, then restart the agent:

```sh
launchctl kickstart -k gui/$(id -u)/local.claude-model-proxy
curl http://127.0.0.1:8787/healthz
```

The MCPB extension can still stay installed. If it sees the LaunchAgent already
owning port `8787`, its status reports the proxy as externally running instead
of treating the port conflict as a failure.

To remove the LaunchAgent:

```sh
npm run launch-agent:uninstall
```

## Extension install UI

The MCPB installer shows only the gateway/proxy basics plus DeepSeek and
Moonshot/Kimi credentials by default. Less common provider credentials and
mapping overrides stay available through one optional advanced JSON field:

```json
{
  "GLM_API_KEY": "...",
  "XIAOMI_API_KEY": "...",
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "OPENAI_API_KEY": "sk-...",
  "GEMINI_API_KEY": "...",
  "QWEN_API_KEY": "sk-..."
}
```

`OLLAMA_API_KEY` already has a dedicated field in the installer UI, but you
can also set it through advanced env if you prefer keeping all keys in one
place.

The advanced field accepts any environment variable listed below, including
`MODEL_MAP`, `MODEL_ALIASES`, `MODEL_ROUTES`, and `REWRITE_RESPONSES`.

## Project layout

```text
.
├── manifest.json              # MCPB extension manifest
├── proxy.mjs                  # HTTP gateway proxy and provider adapters
├── server/index.mjs           # MCP stdio server that starts the proxy
├── scripts/                   # Build, launchd, and Node helper scripts
├── srcs/                      # README screenshots and images
├── test/proxy.test.mjs        # Node test suite
├── start.sh                   # Standalone launcher
├── .env.claude-code.example   # Claude Code client configuration template
└── .env.example               # Safe local configuration template
```

Generated files under `dist/`, local `.env` files, logs, editor files, and
dependencies are ignored by `.gitignore`.

## Notes

DeepSeek, Moonshot/Kimi, GLM, Xiaomi MiMo, and Anthropic are treated as
Anthropic Messages-compatible upstreams. OpenAI, Gemini, Qwen, and Ollama
Cloud are adapted through their OpenAI-compatible Chat Completions endpoints.
The adapter covers normal text and image message content plus streaming text
deltas; Anthropic tool-use blocks, audio, and provider-specific advanced
options are intentionally left as upstream-specific behavior.

Ollama Cloud's OpenAI-compatible surface is officially marked experimental by
upstream. If a future Ollama release breaks the chat-completions chunk shape
the proxy decodes, drop `stream` to `false` for a quick workaround while the
adapter is updated. The current request/response paths are exercised by
`test/proxy.test.mjs`.
