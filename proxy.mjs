#!/usr/bin/env node

import http from 'node:http';
import https from 'node:https';
import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';

export const DEFAULT_MODEL_MAP = Object.freeze({
  'claude-deepseek-v4-flash': 'deepseek-v4-flash',
  'claude-deepseek-v4-pro': 'deepseek-v4-pro',
  'claude-kimi-k2.6': 'kimi-k2.6',
  'claude-glm-4.5-air': 'glm-4.5-air',
  'claude-glm-4.6': 'glm-4.6',
  'claude-glm-4.7': 'glm-4.7',
  'claude-glm-5': 'glm-5',
  'claude-glm-5.1': 'glm-5.1',
  'claude-mimo-v2-flash': 'mimo-v2-flash',
  'claude-mimo-v2-pro': 'mimo-v2-pro',
  'claude-mimo-v2.5-pro': 'mimo-v2.5-pro',
  'claude-mimo-v2-omni': 'mimo-v2-omni',
  'claude-gpt-5.5': 'gpt-5.5',
  'claude-gpt-5.4': 'gpt-5.4',
  'claude-gpt-5.4-mini': 'gpt-5.4-mini',
  'claude-gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
  'claude-gemini-3-flash-preview': 'gemini-3-flash-preview',
  'claude-gemini-2.5-pro': 'gemini-2.5-pro',
  'claude-gemini-2.5-flash': 'gemini-2.5-flash',
  'claude-gemini-3.1-flash-lite-preview': 'gemini-3.1-flash-lite-preview',
  'claude-gemini-2.0-flash': 'gemini-2.0-flash',
  'claude-qwen-flash': 'qwen-flash',
  'claude-qwen-plus': 'qwen-plus',
  'claude-qwen-max': 'qwen-max',
  // Ollama Cloud (Turbo) — hosted at ollama.com, no local install required.
  // Cloud-routing tags: `-cloud` for sized models, `:cloud` for unsized.
  // Bare ids would hit local Ollama weights and fail on the hosted service.
  // gpt-oss
  'claude-ollama-gpt-oss-20b': 'gpt-oss:20b-cloud',
  'claude-ollama-gpt-oss-120b': 'gpt-oss:120b-cloud',
  // DeepSeek
  'claude-ollama-deepseek-v3.1': 'deepseek-v3.1:671b-cloud',
  'claude-ollama-deepseek-v3.2': 'deepseek-v3.2:cloud',
  'claude-ollama-deepseek-v4-flash': 'deepseek-v4-flash:cloud',
  'claude-ollama-deepseek-v4-pro': 'deepseek-v4-pro:cloud',
  // Qwen
  'claude-ollama-qwen3-coder': 'qwen3-coder:480b-cloud',
  'claude-ollama-qwen3-coder-next': 'qwen3-coder-next:cloud',
  'claude-ollama-qwen3-vl': 'qwen3-vl:235b-cloud',
  'claude-ollama-qwen3-vl-instruct': 'qwen3-vl:235b-instruct-cloud',
  'claude-ollama-qwen3-next': 'qwen3-next:80b-cloud',
  'claude-ollama-qwen3.5': 'qwen3.5:cloud',
  // Kimi (Moonshot)
  'claude-ollama-kimi-k2': 'kimi-k2:1t-cloud',
  'claude-ollama-kimi-k2-thinking': 'kimi-k2-thinking:cloud',
  'claude-ollama-kimi-k2.6': 'kimi-k2.6:cloud',
  // GLM (Zhipu)
  'claude-ollama-glm-4.6': 'glm-4.6:cloud',
  'claude-ollama-glm-4.7': 'glm-4.7:cloud',
  'claude-ollama-glm-5': 'glm-5:cloud',
  'claude-ollama-glm-5.1': 'glm-5.1:cloud',
  // MiniMax
  'claude-ollama-minimax-m2': 'minimax-m2:cloud',
  'claude-ollama-minimax-m2.1': 'minimax-m2.1:cloud',
  'claude-ollama-minimax-m2.5': 'minimax-m2.5:cloud',
  'claude-ollama-minimax-m2.7': 'minimax-m2.7:cloud',
  // NVIDIA Nemotron
  'claude-ollama-nemotron-3-nano': 'nemotron-3-nano:30b-cloud',
  'claude-ollama-nemotron-3-super': 'nemotron-3-super:cloud',
  // Mistral / Devstral
  'claude-ollama-devstral-small-2': 'devstral-small-2:24b-cloud',
  'claude-ollama-ministral-3': 'ministral-3:8b-cloud',
  // Google
  'claude-ollama-gemma4-31b': 'gemma4:31b-cloud',
  'claude-ollama-gemini-3-flash-preview': 'gemini-3-flash-preview:cloud',
  // Other
  'claude-ollama-rnj-1': 'rnj-1:8b-cloud',
  // Short aliases pointing at popular Ollama Cloud upstreams.
  'claude-dsv4-flash': 'deepseek-v4-flash:cloud',
  'claude-dsv4-pro': 'deepseek-v4-pro:cloud',
  'claude-glm51': 'glm-5.1:cloud',
  'claude-haiku-4-5': 'claude-haiku-4-5',
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-opus-4-7': 'claude-opus-4-7',
  'claude-sonnet-4-5': 'claude-sonnet-4-5',
  'claude-opus-4-1': 'claude-opus-4-1',
});

export const DEFAULT_MODEL_ALIASES = Object.freeze({
  'deepseek-v4-flash': 'claude-deepseek-v4-flash',
  'deepseek-v4-pro': 'claude-deepseek-v4-pro',
  'kimi-k2.6': 'claude-kimi-k2.6',
  'glm-4.5-air': 'claude-glm-4.5-air',
  'glm-4.6': 'claude-glm-4.6',
  'glm-4.7': 'claude-glm-4.7',
  'glm-5': 'claude-glm-5',
  'glm-5.1': 'claude-glm-5.1',
  'mimo-v2-flash': 'claude-mimo-v2-flash',
  'mimo-v2-pro': 'claude-mimo-v2-pro',
  'mimo-v2.5-pro': 'claude-mimo-v2.5-pro',
  'mimo-v2-omni': 'claude-mimo-v2-omni',
  'gpt-5.5': 'claude-gpt-5.5',
  'gpt-5.4': 'claude-gpt-5.4',
  'gpt-5.4-mini': 'claude-gpt-5.4-mini',
  'gemini-3.1-flash-lite-preview': 'claude-gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview': 'claude-gemini-3-flash-preview',
  'gemini-3.1-pro-preview': 'claude-gemini-3.1-pro-preview',
  'gemini-2.5-pro': 'claude-gemini-2.5-pro',
  'gemini-2.5-flash': 'claude-gemini-2.5-flash',
  'gemini-2.0-flash': 'claude-gemini-2.0-flash',
  'qwen-flash': 'claude-qwen-flash',
  'qwen-plus': 'claude-qwen-plus',
  'qwen-max': 'claude-qwen-max',
  // Ollama Cloud upstream → Claude alias. Where multiple aliases share an
  // upstream id (e.g. claude-ollama-deepseek-v4-flash and claude-dsv4-flash
  // both map to deepseek-v4-flash:cloud), buildResponseModelMap restores the
  // request alias used for that call; this table is the default fallback.
  'gpt-oss:20b-cloud': 'claude-ollama-gpt-oss-20b',
  'gpt-oss:120b-cloud': 'claude-ollama-gpt-oss-120b',
  'deepseek-v3.1:671b-cloud': 'claude-ollama-deepseek-v3.1',
  'deepseek-v3.2:cloud': 'claude-ollama-deepseek-v3.2',
  'deepseek-v4-flash:cloud': 'claude-dsv4-flash',
  'deepseek-v4-pro:cloud': 'claude-dsv4-pro',
  'qwen3-coder:480b-cloud': 'claude-ollama-qwen3-coder',
  'qwen3-coder-next:cloud': 'claude-ollama-qwen3-coder-next',
  'qwen3-vl:235b-cloud': 'claude-ollama-qwen3-vl',
  'qwen3-vl:235b-instruct-cloud': 'claude-ollama-qwen3-vl-instruct',
  'qwen3-next:80b-cloud': 'claude-ollama-qwen3-next',
  'qwen3.5:cloud': 'claude-ollama-qwen3.5',
  'kimi-k2:1t-cloud': 'claude-ollama-kimi-k2',
  'kimi-k2-thinking:cloud': 'claude-ollama-kimi-k2-thinking',
  'kimi-k2.6:cloud': 'claude-ollama-kimi-k2.6',
  'glm-4.6:cloud': 'claude-ollama-glm-4.6',
  'glm-4.7:cloud': 'claude-ollama-glm-4.7',
  'glm-5:cloud': 'claude-ollama-glm-5',
  'glm-5.1:cloud': 'claude-glm51',
  'minimax-m2:cloud': 'claude-ollama-minimax-m2',
  'minimax-m2.1:cloud': 'claude-ollama-minimax-m2.1',
  'minimax-m2.5:cloud': 'claude-ollama-minimax-m2.5',
  'minimax-m2.7:cloud': 'claude-ollama-minimax-m2.7',
  'nemotron-3-nano:30b-cloud': 'claude-ollama-nemotron-3-nano',
  'nemotron-3-super:cloud': 'claude-ollama-nemotron-3-super',
  'devstral-small-2:24b-cloud': 'claude-ollama-devstral-small-2',
  'ministral-3:8b-cloud': 'claude-ollama-ministral-3',
  'gemma4:31b-cloud': 'claude-ollama-gemma4-31b',
  'gemini-3-flash-preview:cloud': 'claude-ollama-gemini-3-flash-preview',
  'rnj-1:8b-cloud': 'claude-ollama-rnj-1',
  'claude-haiku-4-5': 'claude-haiku-4-5',
  'claude-sonnet-4-6': 'claude-sonnet-4-6',
  'claude-opus-4-7': 'claude-opus-4-7',
  'claude-sonnet-4-5': 'claude-sonnet-4-5',
  'claude-opus-4-1': 'claude-opus-4-1',
});

export const DEFAULT_MODEL_ROUTES = Object.freeze({
  'deepseek-v4-flash': 'deepseek',
  'deepseek-v4-pro': 'deepseek',
  'kimi-k2.6': 'moonshot',
  'glm-4.5-air': 'glm',
  'glm-4.6': 'glm',
  'glm-4.7': 'glm',
  'glm-5': 'glm',
  'glm-5.1': 'glm',
  'mimo-v2-flash': 'xiaomi',
  'mimo-v2-pro': 'xiaomi',
  'mimo-v2.5-pro': 'xiaomi',
  'mimo-v2-omni': 'xiaomi',
  'gpt-5.5': 'openai',
  'gpt-5.4': 'openai',
  'gpt-5.4-mini': 'openai',
  'gemini-3.1-pro-preview': 'gemini',
  'gemini-3-flash-preview': 'gemini',
  'gemini-2.5-pro': 'gemini',
  'gemini-2.5-flash': 'gemini',
  'gemini-3.1-flash-lite-preview': 'gemini',
  'gemini-2.0-flash': 'gemini',
  'qwen-flash': 'qwen',
  'qwen-plus': 'qwen',
  'qwen-max': 'qwen',
  'claude-ollama-gpt-oss-20b': 'ollama',
  'claude-ollama-gpt-oss-120b': 'ollama',
  'claude-ollama-deepseek-v3.1': 'ollama',
  'claude-ollama-deepseek-v3.2': 'ollama',
  'claude-ollama-deepseek-v4-flash': 'ollama',
  'claude-ollama-deepseek-v4-pro': 'ollama',
  'claude-ollama-qwen3-coder': 'ollama',
  'claude-ollama-qwen3-coder-next': 'ollama',
  'claude-ollama-qwen3-vl': 'ollama',
  'claude-ollama-qwen3-vl-instruct': 'ollama',
  'claude-ollama-qwen3-next': 'ollama',
  'claude-ollama-qwen3.5': 'ollama',
  'claude-ollama-kimi-k2': 'ollama',
  'claude-ollama-kimi-k2-thinking': 'ollama',
  'claude-ollama-kimi-k2.6': 'ollama',
  'claude-ollama-glm-4.6': 'ollama',
  'claude-ollama-glm-4.7': 'ollama',
  'claude-ollama-glm-5': 'ollama',
  'claude-ollama-glm-5.1': 'ollama',
  'claude-ollama-minimax-m2': 'ollama',
  'claude-ollama-minimax-m2.1': 'ollama',
  'claude-ollama-minimax-m2.5': 'ollama',
  'claude-ollama-minimax-m2.7': 'ollama',
  'claude-ollama-nemotron-3-nano': 'ollama',
  'claude-ollama-nemotron-3-super': 'ollama',
  'claude-ollama-devstral-small-2': 'ollama',
  'claude-ollama-ministral-3': 'ollama',
  'claude-ollama-gemma4-31b': 'ollama',
  'claude-ollama-gemini-3-flash-preview': 'ollama',
  'claude-ollama-rnj-1': 'ollama',
  'claude-dsv4-flash': 'ollama',
  'claude-dsv4-pro': 'ollama',
  'claude-glm51': 'ollama',
  'claude-haiku-4-5': 'anthropic',
  'claude-sonnet-4-6': 'anthropic',
  'claude-opus-4-7': 'anthropic',
  'claude-sonnet-4-5': 'anthropic',
  'claude-opus-4-1': 'anthropic',
});

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const MODEL_VALUE_KEYS = new Set([
  'default_model',
  'id',
  'model',
  'model_id',
  'name',
]);

const MODEL_ARRAY_KEYS = new Set([
  'inferenceModels',
  'inference_models',
  'models',
]);

const DEFAULT_REQUEST_BODY_LIMIT_BYTES = 50 * 1024 * 1024;

export function loadConfig(env = process.env) {
  env = mergeAdvancedEnv(env);

  const port = parseInteger(env.PORT || env.CLAUDE_DEEPSEEK_PROXY_PORT, 8787);
  const modelMap = {
    ...DEFAULT_MODEL_MAP,
    ...parseStringMap(env.MODEL_MAP, 'MODEL_MAP'),
  };
  const modelAliases = {
    ...DEFAULT_MODEL_ALIASES,
    ...parseStringMap(env.MODEL_ALIASES, 'MODEL_ALIASES'),
  };
  const modelRoutes = normalizeProviderRoutes({
    ...DEFAULT_MODEL_ROUTES,
    ...parseStringMap(env.MODEL_ROUTES, 'MODEL_ROUTES'),
  });

  return {
    port,
    baseUrl: env.BASE_URL || env.PROXY_BASE_URL || 'http://127.0.0.1:8787',
    defaultProvider: normalizeProviderName(env.DEFAULT_PROVIDER || 'deepseek'),
    providers: {
      deepseek: {
        upstreamBaseUrl: new URL(
          env.DEEPSEEK_BASE_URL
            || env.UPSTREAM_BASE_URL
            || 'https://api.deepseek.com/anthropic',
        ),
        upstreamApiKey: env.DEEPSEEK_API_KEY || env.UPSTREAM_API_KEY || '',
        format: 'anthropic',
        authScheme: 'bearer',
      },
      moonshot: {
        upstreamBaseUrl: new URL(
          env.MOONSHOT_BASE_URL
            || env.KIMI_BASE_URL
            || 'https://api.moonshot.cn/anthropic',
        ),
        upstreamApiKey: env.MOONSHOT_API_KEY || env.KIMI_API_KEY || '',
        format: 'anthropic',
        authScheme: 'bearer',
      },
      glm: {
        upstreamBaseUrl: new URL(
          env.GLM_BASE_URL
            || env.ZAI_BASE_URL
            || env.ZHIPU_BASE_URL
            || 'https://api.z.ai/api/anthropic',
        ),
        upstreamApiKey: env.GLM_API_KEY || env.ZAI_API_KEY || env.ZHIPU_API_KEY || '',
        format: 'anthropic',
        authScheme: 'bearer',
      },
      xiaomi: {
        upstreamBaseUrl: new URL(
          env.XIAOMI_BASE_URL
            || env.MIMO_BASE_URL
            || 'https://api.xiaomimimo.com/anthropic',
        ),
        upstreamApiKey: env.XIAOMI_API_KEY || env.MIMO_API_KEY || '',
        format: 'anthropic',
        authScheme: 'bearer',
      },
      openai: {
        upstreamBaseUrl: new URL(env.OPENAI_BASE_URL || 'https://api.openai.com/v1'),
        upstreamApiKey: env.OPENAI_API_KEY || '',
        format: 'openai-chat',
        authScheme: 'bearer',
        maxTokensField: 'max_completion_tokens',
      },
      gemini: {
        upstreamBaseUrl: new URL(
          env.GEMINI_BASE_URL
            || env.GOOGLE_BASE_URL
            || 'https://generativelanguage.googleapis.com/v1beta/openai',
        ),
        upstreamApiKey: env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '',
        format: 'openai-chat',
        authScheme: 'bearer',
        maxTokensField: 'max_tokens',
      },
      qwen: {
        upstreamBaseUrl: new URL(
          env.QWEN_BASE_URL
            || env.DASHSCOPE_BASE_URL
            || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        ),
        upstreamApiKey: env.QWEN_API_KEY || env.DASHSCOPE_API_KEY || '',
        format: 'openai-chat',
        authScheme: 'bearer',
        maxTokensField: 'max_tokens',
      },
      ollama: {
        upstreamBaseUrl: new URL(env.OLLAMA_BASE_URL || 'https://ollama.com/v1'),
        upstreamApiKey: env.OLLAMA_API_KEY || '',
        format: 'openai-chat',
        authScheme: 'bearer',
        maxTokensField: 'max_tokens',
      },
      anthropic: {
        upstreamBaseUrl: new URL(env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'),
        upstreamApiKey: env.ANTHROPIC_API_KEY || '',
        format: 'anthropic',
        authScheme: 'x-api-key',
        anthropicVersion: env.ANTHROPIC_VERSION || '2023-06-01',
      },
    },
    modelMap,
    modelAliases,
    modelRoutes,
    rewriteResponses: parseBoolean(env.REWRITE_RESPONSES, true),
    requestBodyLimitBytes: parseInteger(
      env.REQUEST_BODY_LIMIT_BYTES,
      DEFAULT_REQUEST_BODY_LIMIT_BYTES,
    ),
  };
}

export function createProxyServer(config = loadConfig()) {
  const normalizedConfig = normalizeConfig(config);

  return http.createServer(async (clientReq, clientRes) => {
    try {
      if (clientReq.method === 'GET' && clientReq.url === '/healthz') {
        sendJson(clientRes, 200, {
          ok: true,
          baseUrl: normalizedConfig.baseUrl,
          defaultProvider: normalizedConfig.defaultProvider,
          providers: getProviderStatus(normalizedConfig.providers),
          modelMap: normalizedConfig.modelMap,
          modelAliases: normalizedConfig.modelAliases,
          modelRoutes: normalizedConfig.modelRoutes,
          rewriteResponses: normalizedConfig.rewriteResponses,
        });
        return;
      }

      if (clientReq.method === 'GET' && isModelsRequest(clientReq.url)) {
        handleModelsRequest(clientReq, clientRes, normalizedConfig);
        return;
      }

      const rawBody = await readRequestBody(
        clientReq,
        normalizedConfig.requestBodyLimitBytes,
      );
      const contentType = String(clientReq.headers['content-type'] || '');
      const preparedRequest = prepareRequest(rawBody, contentType, normalizedConfig);
      const target = buildTargetUrl(preparedRequest.provider, clientReq.url || '/');
      const headers = buildUpstreamHeaders(
        clientReq.headers,
        target,
        preparedRequest.body,
        preparedRequest.provider,
      );

      forwardRequest({
        target,
        method: clientReq.method || 'GET',
        headers,
        body: preparedRequest.body,
        clientRes,
        rewriteResponses: normalizedConfig.rewriteResponses,
        responseModelMap: preparedRequest.responseModelMap,
        provider: preparedRequest.provider,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      sendJson(clientRes, statusCode, {
        error: String(error.message || error),
      });
    }
  });
}

function isModelsRequest(rawUrl = '/') {
  const pathname = new URL(rawUrl, 'http://127.0.0.1').pathname;
  return pathname === '/v1/models' || pathname.startsWith('/v1/models/');
}

function handleModelsRequest(req, res, config) {
  const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
  const models = listConfiguredModels(config);

  if (pathname === '/v1/models') {
    sendJson(res, 200, {
      data: models,
      first_id: models[0]?.id || null,
      has_more: false,
      last_id: models.at(-1)?.id || null,
    });
    return;
  }

  const modelId = decodeURIComponent(pathname.slice('/v1/models/'.length));
  const model = models.find((item) => item.id === modelId);
  if (!model) {
    sendJson(res, 404, {
      error: `Unknown model: ${modelId}`,
    });
    return;
  }

  sendJson(res, 200, model);
}

const MODELS_CREATED_AT = '2026-01-01T00:00:00Z';

function listConfiguredModels(config) {
  return Object.keys(config.modelMap)
    .sort()
    .map((id) => ({
      type: 'model',
      id,
      display_name: toModelDisplayName(id),
      created_at: MODELS_CREATED_AT,
    }));
}

function toModelDisplayName(id) {
  const stripped = id.replace(/^claude-/, '');
  return stripped
    .split('-')
    .filter(Boolean)
    .map((segment) => {
      if (!segment) {
        return segment;
      }
      if (/^v?\d/.test(segment)) {
        return segment;
      }
      return segment[0].toUpperCase() + segment.slice(1);
    })
    .join(' ');
}

function prepareRequest(rawBody, contentType, config) {
  if (rawBody.length === 0 || !isJsonContentType(contentType)) {
    return {
      body: rawBody,
      provider: resolveProvider('', config),
      responseModelMap: config.modelAliases,
    };
  }

  const text = rawBody.toString('utf8');
  const parsed = JSON.parse(text);
  const rewritten = rewriteModelValues(parsed, config.modelMap);
  const requestModels = collectModelValues(parsed);
  const upstreamModels = collectModelValues(rewritten);
  const routeModel = upstreamModels[0] || requestModels[0] || '';
  const provider = resolveProvider(
    routeModel,
    config,
    upstreamModels.length > 0,
    requestModels[0] || '',
  );

  return {
    body: formatRequestBody(rewritten, provider),
    provider,
    responseModelMap: buildResponseModelMap(
      upstreamModels,
      config.modelAliases,
      requestModels,
      config.modelMap,
    ),
  };
}

function forwardRequest({
  target,
  method,
  headers,
  body,
  clientRes,
  rewriteResponses,
  responseModelMap,
  provider,
}) {
  const transport = target.protocol === 'https:' ? https : http;
  const upstreamReq = transport.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || undefined,
      method,
      path: `${target.pathname}${target.search}`,
      headers,
    },
    (upstreamRes) => handleUpstreamResponse(upstreamRes, clientRes, {
      rewriteResponses,
      responseModelMap,
      provider,
    }),
  );

  upstreamReq.on('error', (error) => {
    if (!clientRes.headersSent) {
      sendJson(clientRes, 502, {
        error: `Upstream request failed: ${error.message}`,
      });
      return;
    }
    clientRes.destroy(error);
  });

  upstreamReq.end(body);
}

function handleUpstreamResponse(upstreamRes, clientRes, config) {
  const headers = sanitizeResponseHeaders(upstreamRes.headers);
  const contentType = String(headers['content-type'] || '');

  if (
    config.provider?.format === 'openai-chat'
    && isSuccessfulStatus(upstreamRes.statusCode)
  ) {
    handleOpenAIChatResponse(upstreamRes, clientRes, {
      ...config,
      headers,
      contentType,
    });
    return;
  }

  if (config.rewriteResponses && isJsonContentType(contentType)) {
    collectResponse(upstreamRes)
      .then((body) => {
        const rewritten = rewriteJsonResponseBody(body, config.responseModelMap);
        headers['content-length'] = String(rewritten.length);
        clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.statusMessage, headers);
        clientRes.end(rewritten);
      })
      .catch((error) => {
        if (!clientRes.headersSent) {
          sendJson(clientRes, 502, {
            error: `Upstream response handling failed: ${error.message}`,
          });
          return;
        }
        clientRes.destroy(error);
      });
    return;
  }

  clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.statusMessage, headers);

  if (config.rewriteResponses && isTextualContentType(contentType)) {
    upstreamRes.pipe(createReplaceStream(config.responseModelMap)).pipe(clientRes);
    return;
  }

  upstreamRes.pipe(clientRes);
}

function formatRequestBody(rewrittenBody, provider) {
  if (provider.format === 'openai-chat') {
    return Buffer.from(JSON.stringify(toOpenAIChatRequest(rewrittenBody, provider)));
  }

  return Buffer.from(JSON.stringify(rewrittenBody));
}

function toOpenAIChatRequest(body, provider) {
  const request = {
    model: body.model,
    messages: [],
  };

  const systemContent = toOpenAIContent(body.system, 'system');
  if (!isEmptyOpenAIContent(systemContent)) {
    request.messages.push({
      role: 'system',
      content: systemContent,
    });
  }

  for (const message of Array.isArray(body.messages) ? body.messages : []) {
    const role = toOpenAIMessageRole(message.role);
    request.messages.push({
      role,
      content: toOpenAIContent(message.content, role),
    });
  }

  copyDefined(request, body, 'temperature');
  copyDefined(request, body, 'top_p');
  copyDefined(request, body, 'stream');
  copyDefined(request, body, 'presence_penalty');
  copyDefined(request, body, 'frequency_penalty');

  if (body.max_tokens !== undefined) {
    request[provider.maxTokensField || 'max_tokens'] = body.max_tokens;
  }

  if (Array.isArray(body.stop_sequences) && body.stop_sequences.length > 0) {
    request.stop = body.stop_sequences;
  }

  if (typeof body.metadata?.user_id === 'string' && body.metadata.user_id) {
    request.user = body.metadata.user_id;
  }

  return request;
}

function toOpenAIMessageRole(role) {
  return role === 'assistant' ? 'assistant' : 'user';
}

function toOpenAIContent(content, role) {
  if (content === undefined || content === null) {
    return '';
  }

  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return stringifyUnknownContent(content);
  }

  const parts = content.flatMap((part) => toOpenAIContentPart(part));
  const hasNonTextPart = parts.some((part) => typeof part !== 'string' && part.type !== 'text');
  if (role !== 'user' || !hasNonTextPart) {
    return parts.map((part) => (typeof part === 'string' ? part : part.text || '')).join('');
  }

  return parts.map((part) => (typeof part === 'string' ? { type: 'text', text: part } : part));
}

function toOpenAIContentPart(part) {
  if (typeof part === 'string') {
    return [part];
  }

  if (!part || typeof part !== 'object') {
    return [String(part ?? '')];
  }

  if (part.type === 'text') {
    return [{ type: 'text', text: part.text || '' }];
  }

  if (part.type === 'image' && part.source?.type === 'base64') {
    return [{
      type: 'image_url',
      image_url: {
        url: `data:${part.source.media_type || 'image/png'};base64,${part.source.data || ''}`,
      },
    }];
  }

  if (part.type === 'tool_result') {
    return [{ type: 'text', text: toTextContent(part.content) }];
  }

  if (part.text) {
    return [{ type: 'text', text: String(part.text) }];
  }

  return [{ type: 'text', text: stringifyUnknownContent(part) }];
}

function toTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item?.type === 'text') {
        return item.text || '';
      }
      return stringifyUnknownContent(item);
    }).join('');
  }

  return stringifyUnknownContent(content);
}

function stringifyUnknownContent(value) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isEmptyOpenAIContent(content) {
  if (Array.isArray(content)) {
    return content.length === 0;
  }
  return content === '';
}

function copyDefined(target, source, key) {
  if (source[key] !== undefined) {
    target[key] = source[key];
  }
}

function handleOpenAIChatResponse(upstreamRes, clientRes, config) {
  const responseModelMap = config.rewriteResponses ? config.responseModelMap : {};

  if (isJsonContentType(config.contentType)) {
    collectResponse(upstreamRes)
      .then((body) => {
        const converted = convertOpenAIChatJsonResponse(body, responseModelMap);
        config.headers['content-type'] = 'application/json; charset=utf-8';
        config.headers['content-length'] = String(converted.length);
        clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.statusMessage, config.headers);
        clientRes.end(converted);
      })
      .catch((error) => {
        if (!clientRes.headersSent) {
          sendJson(clientRes, 502, {
            error: `OpenAI-compatible response handling failed: ${error.message}`,
          });
          return;
        }
        clientRes.destroy(error);
      });
    return;
  }

  clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.statusMessage, {
    ...config.headers,
    'content-type': 'text/event-stream; charset=utf-8',
  });
  upstreamRes.pipe(createOpenAIChatSseToAnthropicStream(responseModelMap)).pipe(clientRes);
}

function convertOpenAIChatJsonResponse(body, responseModelMap) {
  if (body.length === 0) {
    return body;
  }

  const parsed = JSON.parse(body.toString('utf8'));
  const choice = parsed.choices?.[0];
  if (!choice) {
    return Buffer.from(JSON.stringify(rewriteModelValues(parsed, responseModelMap)));
  }

  const text = openAIMessageText(choice.message);
  const message = {
    id: parsed.id || 'msg_openai_proxy',
    type: 'message',
    role: 'assistant',
    model: rewriteModelName(parsed.model || '', responseModelMap),
    content: text ? [{ type: 'text', text }] : [],
    stop_reason: toAnthropicStopReason(choice.finish_reason),
    stop_sequence: null,
    usage: toAnthropicUsage(parsed.usage),
  };

  return Buffer.from(JSON.stringify(message));
}

function openAIMessageText(message) {
  if (!message) {
    return '';
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content.map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (part?.type === 'text') {
        return part.text || '';
      }
      if (part?.text) {
        return String(part.text);
      }
      if (part?.refusal) {
        return String(part.refusal);
      }
      return '';
    }).join('');
  }

  return message.refusal || '';
}

function createOpenAIChatSseToAnthropicStream(responseModelMap) {
  const decoder = new StringDecoder('utf8');
  const state = {
    buffer: '',
    messageStarted: false,
    contentBlockStarted: false,
    stopped: false,
    id: 'msg_openai_proxy',
    model: '',
    stopReason: 'end_turn',
    usage: {
      input_tokens: 0,
      output_tokens: 0,
    },
  };

  return new Transform({
    transform(chunk, _encoding, callback) {
      state.buffer += decoder.write(chunk).replace(/\r\n/g, '\n');
      processOpenAISseBuffer(this, state, responseModelMap);
      callback();
    },
    flush(callback) {
      state.buffer += decoder.end().replace(/\r\n/g, '\n');
      processOpenAISseBuffer(this, state, responseModelMap, true);
      stopAnthropicStream(this, state);
      callback();
    },
  });
}

function processOpenAISseBuffer(stream, state, responseModelMap, flush = false) {
  while (true) {
    const separatorIndex = state.buffer.indexOf('\n\n');
    if (separatorIndex === -1) {
      break;
    }

    const eventText = state.buffer.slice(0, separatorIndex);
    state.buffer = state.buffer.slice(separatorIndex + 2);
    handleOpenAISseEvent(stream, eventText, state, responseModelMap);
  }

  if (flush && state.buffer.trim()) {
    handleOpenAISseEvent(stream, state.buffer, state, responseModelMap);
    state.buffer = '';
  }
}

function handleOpenAISseEvent(stream, eventText, state, responseModelMap) {
  const data = eventText
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim();

  if (!data) {
    return;
  }

  if (data === '[DONE]') {
    stopAnthropicStream(stream, state);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    return;
  }

  startAnthropicStream(stream, state, parsed, responseModelMap);

  const choice = parsed.choices?.[0];
  if (!choice) {
    if (parsed.usage) {
      state.usage = toAnthropicUsage(parsed.usage);
    }
    return;
  }

  if (choice.finish_reason) {
    state.stopReason = toAnthropicStopReason(choice.finish_reason);
  }

  const text = openAIStreamDeltaText(choice.delta);
  if (text) {
    if (!state.contentBlockStarted) {
      pushSse(stream, 'content_block_start', {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: '',
        },
      });
      state.contentBlockStarted = true;
    }

    pushSse(stream, 'content_block_delta', {
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text,
      },
    });
  }

  if (parsed.usage) {
    state.usage = toAnthropicUsage(parsed.usage);
  }
}

function startAnthropicStream(stream, state, chunk, responseModelMap) {
  if (state.messageStarted) {
    return;
  }

  state.id = chunk.id || state.id;
  state.model = rewriteModelName(chunk.model || state.model, responseModelMap);
  pushSse(stream, 'message_start', {
    type: 'message_start',
    message: {
      id: state.id,
      type: 'message',
      role: 'assistant',
      model: state.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: state.usage,
    },
  });
  state.messageStarted = true;
}

function stopAnthropicStream(stream, state) {
  if (state.stopped) {
    return;
  }

  if (!state.messageStarted) {
    startAnthropicStream(stream, state, {}, {});
  }

  if (state.contentBlockStarted) {
    pushSse(stream, 'content_block_stop', {
      type: 'content_block_stop',
      index: 0,
    });
  }

  pushSse(stream, 'message_delta', {
    type: 'message_delta',
    delta: {
      stop_reason: state.stopReason,
      stop_sequence: null,
    },
    usage: {
      output_tokens: state.usage.output_tokens || 0,
    },
  });
  pushSse(stream, 'message_stop', {
    type: 'message_stop',
  });
  state.stopped = true;
}

function pushSse(stream, event, payload) {
  stream.push(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function openAIStreamDeltaText(delta) {
  if (!delta) {
    return '';
  }

  if (typeof delta.content === 'string') {
    return delta.content;
  }

  if (Array.isArray(delta.content)) {
    return delta.content.map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (part?.type === 'text') {
        return part.text || '';
      }
      if (part?.text) {
        return String(part.text);
      }
      return '';
    }).join('');
  }

  return '';
}

function toAnthropicUsage(usage = {}) {
  return {
    input_tokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
    output_tokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
  };
}

function toAnthropicStopReason(reason) {
  if (reason === 'length') {
    return 'max_tokens';
  }

  if (reason === 'tool_calls' || reason === 'function_call') {
    return 'tool_use';
  }

  return 'end_turn';
}

function rewriteModelName(model, responseModelMap) {
  return responseModelMap[model] || model;
}

function rewriteJsonResponseBody(body, responseModelMap) {
  if (body.length === 0) {
    return body;
  }

  const text = body.toString('utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return body;
  }

  const rewritten = rewriteModelValues(parsed, responseModelMap);
  return Buffer.from(JSON.stringify(rewritten));
}

export function rewriteModelValues(value, modelMap, keyName = '') {
  if (typeof value === 'string') {
    if (MODEL_VALUE_KEYS.has(keyName) || MODEL_ARRAY_KEYS.has(keyName)) {
      return modelMap[value] || value;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteModelValues(item, modelMap, keyName));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        rewriteModelValues(item, modelMap, key),
      ]),
    );
  }

  return value;
}

export function createReplaceStream(modelMap) {
  const entries = Object.entries(modelMap).sort((a, b) => b[0].length - a[0].length);
  const decoder = new StringDecoder('utf8');
  let buffer = '';

  return new Transform({
    transform(chunk, _encoding, callback) {
      buffer += decoder.write(chunk);
      const emitEnd = buffer.lastIndexOf('\n');
      if (emitEnd === -1) {
        callback();
        return;
      }

      const emitText = replaceAllModels(buffer.slice(0, emitEnd + 1), entries);
      buffer = buffer.slice(emitEnd + 1);
      this.push(emitText);
      callback();
    },
    flush(callback) {
      const text = buffer + decoder.end();
      this.push(replaceAllModels(text, entries));
      callback();
    },
  });
}

function replaceAllModels(text, entries) {
  let output = text;
  for (const [from, to] of entries) {
    output = output.replaceAll(from, to);
  }
  return output;
}

function collectModelValues(value, keyName = '') {
  if (typeof value === 'string') {
    return MODEL_VALUE_KEYS.has(keyName) || MODEL_ARRAY_KEYS.has(keyName)
      ? [value]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectModelValues(item, keyName));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => collectModelValues(item, key));
  }

  return [];
}

function buildResponseModelMap(upstreamModels, modelAliases, requestModels = [], modelMap = {}) {
  const selected = {};

  for (const requestModel of requestModels) {
    const upstreamModel = modelMap[requestModel] || requestModel;
    if (upstreamModels.includes(upstreamModel)) {
      selected[upstreamModel] = requestModel;
    }
  }

  for (const model of upstreamModels) {
    if (!selected[model] && modelAliases[model]) {
      selected[model] = modelAliases[model];
    }
  }

  return Object.keys(selected).length > 0 ? selected : modelAliases;
}

function buildUpstreamHeaders(clientHeaders, target, body, provider) {
  const headers = {};

  for (const [key, value] of Object.entries(clientHeaders)) {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey) || lowerKey === 'host' || lowerKey === 'content-length') {
      continue;
    }
    headers[lowerKey] = value;
  }

  headers.host = target.host;
  headers['content-length'] = String(body.length);
  headers['accept-encoding'] = 'identity';

  if (provider.format === 'openai-chat') {
    delete headers['anthropic-version'];
    delete headers['anthropic-beta'];
    delete headers['x-api-key'];
    headers['content-type'] = 'application/json';
  }

  if (provider.upstreamApiKey) {
    delete headers.authorization;
    delete headers['x-api-key'];
    if (provider.authScheme === 'x-api-key') {
      headers['x-api-key'] = provider.upstreamApiKey;
    } else {
      headers.authorization = `Bearer ${provider.upstreamApiKey}`;
    }
  }

  if (provider.authScheme === 'x-api-key' && provider.anthropicVersion) {
    headers['anthropic-version'] = headers['anthropic-version'] || provider.anthropicVersion;
  }

  return headers;
}

function sanitizeResponseHeaders(upstreamHeaders) {
  const headers = {};
  for (const [key, value] of Object.entries(upstreamHeaders)) {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      continue;
    }
    headers[lowerKey] = value;
  }
  delete headers['content-encoding'];
  delete headers['content-length'];
  return headers;
}

function buildTargetUrl(provider, incomingUrl) {
  const source = new URL(incomingUrl, 'http://localhost');
  const target = new URL(provider.upstreamBaseUrl.href);
  const basePath = target.pathname.replace(/\/$/, '');
  const targetPath = provider.format === 'openai-chat' && source.pathname.endsWith('/messages')
    ? '/chat/completions'
    : source.pathname;
  target.pathname = `${basePath}${targetPath}`.replace(/\/{2,}/g, '/');
  target.search = provider.format === 'openai-chat' ? '' : source.search;
  return target;
}

async function readRequestBody(req, limitBytes) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of req) {
    totalLength += chunk.length;
    if (totalLength > limitBytes) {
      const error = new Error(`Request body exceeds ${limitBytes} bytes`);
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function collectResponse(res) {
  const chunks = [];
  for await (const chunk of res) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

function mergeAdvancedEnv(env) {
  return {
    ...parseAdvancedEnv(env.ADVANCED_ENV),
    ...env,
  };
}

function parseAdvancedEnv(raw) {
  if (!raw) {
    return {};
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ADVANCED_ENV must be a JSON object');
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => {
      if (!key || value === null || typeof value === 'object') {
        throw new Error('ADVANCED_ENV keys must be non-empty and values must be strings, numbers, or booleans');
      }
      return [key, String(value)];
    }),
  );
}

function parseStringMap(raw, name) {
  if (!raw) {
    return {};
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    return normalizeStringMap(parsed, name);
  }

  const parsed = Object.fromEntries(
    trimmed.split(',').map((entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) {
        throw new Error(`${name} entries must use from=to format`);
      }
      return [
        entry.slice(0, separatorIndex).trim(),
        entry.slice(separatorIndex + 1).trim(),
      ];
    }),
  );

  return normalizeStringMap(parsed, name);
}

function normalizeStringMap(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be a JSON object or from=to list`);
  }

  return Object.fromEntries(
    Object.entries(value).map(([from, to]) => {
      if (!from || typeof to !== 'string' || !to) {
        throw new Error(`${name} keys and values must be non-empty strings`);
      }
      return [from, to];
    }),
  );
}

function normalizeConfig(config) {
  const providers = normalizeProviders(config);
  const providerNames = Object.keys(providers);
  const defaultProvider = normalizeProviderName(
    config.defaultProvider || (providers.deepseek ? 'deepseek' : providerNames[0]),
  );

  if (!providers[defaultProvider]) {
    throw new Error(`No upstream provider configured for ${defaultProvider}`);
  }

  return {
    ...config,
    baseUrl: config.baseUrl || `http://127.0.0.1:${config.port || 8787}`,
    defaultProvider,
    providers,
    modelMap: config.modelMap || DEFAULT_MODEL_MAP,
    modelAliases: config.modelAliases || config.reverseModelMap || DEFAULT_MODEL_ALIASES,
    modelRoutes: normalizeProviderRoutes(config.modelRoutes || DEFAULT_MODEL_ROUTES),
    rewriteResponses: config.rewriteResponses ?? true,
    requestBodyLimitBytes: config.requestBodyLimitBytes || DEFAULT_REQUEST_BODY_LIMIT_BYTES,
  };
}

function normalizeProviders(config) {
  if (config.providers) {
    return Object.fromEntries(
      Object.entries(config.providers).map(([name, provider]) => [
        normalizeProviderName(name),
        normalizeProvider(provider),
      ]),
    );
  }

  if (config.upstreamBaseUrl) {
    return {
      deepseek: normalizeProvider({
        upstreamBaseUrl: config.upstreamBaseUrl,
        upstreamApiKey: config.upstreamApiKey || '',
      }),
    };
  }

  throw new Error('At least one upstream provider must be configured');
}

function normalizeProvider(provider) {
  if (!provider?.upstreamBaseUrl) {
    throw new Error('Provider upstreamBaseUrl is required');
  }

  return {
    upstreamBaseUrl: provider.upstreamBaseUrl instanceof URL
      ? provider.upstreamBaseUrl
      : new URL(provider.upstreamBaseUrl),
    upstreamApiKey: provider.upstreamApiKey || '',
    format: normalizeProviderFormat(provider.format || 'anthropic'),
    authScheme: normalizeAuthScheme(provider.authScheme || 'bearer'),
    anthropicVersion: provider.anthropicVersion || '2023-06-01',
    maxTokensField: provider.maxTokensField || 'max_tokens',
  };
}

function normalizeProviderFormat(format) {
  const normalized = String(format || '').trim().toLowerCase();
  if (normalized === 'anthropic' || normalized === 'openai-chat') {
    return normalized;
  }
  throw new Error(`Unsupported provider format: ${format}`);
}

function normalizeAuthScheme(authScheme) {
  const normalized = String(authScheme || '').trim().toLowerCase();
  if (normalized === 'bearer' || normalized === 'x-api-key') {
    return normalized;
  }
  throw new Error(`Unsupported auth scheme: ${authScheme}`);
}

function normalizeProviderRoutes(modelRoutes) {
  return Object.fromEntries(
    Object.entries(modelRoutes).map(([model, provider]) => [
      model,
      normalizeProviderName(provider),
    ]),
  );
}

function normalizeProviderName(provider) {
  const normalized = String(provider || '').trim().toLowerCase();
  return normalized === 'kimi' ? 'moonshot' : normalized;
}

function resolveProvider(model, config, modelIsAlreadyMapped = false, requestModel = '') {
  const upstreamModel = modelIsAlreadyMapped ? model : config.modelMap[model] || model;
  const providerName = (requestModel && config.modelRoutes[requestModel])
    || config.modelRoutes[upstreamModel]
    || config.modelRoutes[model]
    || config.defaultProvider;
  const provider = config.providers[providerName];

  if (!provider) {
    throw new Error(`No upstream provider configured for ${providerName}`);
  }

  return provider;
}

function getProviderStatus(providers) {
  return Object.fromEntries(
    Object.entries(providers).map(([name, provider]) => [
      name,
      {
        upstreamBaseUrl: redactUrl(provider.upstreamBaseUrl),
        hasApiKey: Boolean(provider.upstreamApiKey),
        format: provider.format,
        authScheme: provider.authScheme,
      },
    ]),
  );
}

function parseInteger(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }

  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return parsed;
}

function parseBoolean(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }

  if (['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase())) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(String(raw).toLowerCase())) {
    return false;
  }

  throw new Error(`Invalid boolean: ${raw}`);
}

function isSuccessfulStatus(statusCode) {
  return Number.isInteger(statusCode) && statusCode >= 200 && statusCode < 300;
}

function isJsonContentType(contentType) {
  return /\bapplication\/(?:[\w.+-]+\+)?json\b/i.test(contentType);
}

function isTextualContentType(contentType) {
  return /^text\//i.test(contentType) || /\bjson\b/i.test(contentType);
}

function redactUrl(url) {
  const redacted = new URL(url.href);
  redacted.username = '';
  redacted.password = '';
  return redacted.href;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const config = loadConfig();
  const server = createProxyServer(config);
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Claude model proxy port is already in use: ${config.port}`);
      process.exit(0);
    }
    console.error(`Claude model proxy failed: ${error.message}`);
    process.exit(1);
  });
  server.listen(config.port, '127.0.0.1', () => {
    console.log(`Claude model proxy listening on http://127.0.0.1:${config.port}`);
    console.log(`Gateway base URL: ${config.baseUrl}`);
    console.log(`Providers: ${JSON.stringify(getProviderStatus(config.providers))}`);
    console.log(`Model map: ${JSON.stringify(config.modelMap)}`);
  });
}
