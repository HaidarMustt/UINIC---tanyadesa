// A small client for any OpenAI-compatible chat API (Groq, OpenRouter, OpenAI, ...).
// Switching provider only means changing the AI_* variables in .env.

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRY_WAIT_MS = 10_000;

export interface ChatClient {
  completeJson(system: string, user: string, schemaName: string, jsonSchema: unknown): Promise<unknown>;
  completeText(prompt: string): Promise<string>;
}

interface ChatConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  reasoningEffort?: string; // "low" | "medium" | "high", for reasoning models
  // Used when the main model hits its rate limit. On Groq each model has its own quota.
  fallbackModel?: string;
}

function readConfigFromEnv(): ChatConfig {
  const { AI_BASE_URL, AI_MODEL, AI_API_KEY, AI_REASONING_EFFORT, AI_FALLBACK_MODEL } = process.env;
  if (!AI_BASE_URL || !AI_MODEL || !AI_API_KEY) {
    throw new Error("AI_BASE_URL, AI_MODEL, dan AI_API_KEY harus diisi di .env");
  }
  return {
    baseUrl: AI_BASE_URL,
    model: AI_MODEL,
    apiKey: AI_API_KEY,
    reasoningEffort: AI_REASONING_EFFORT || undefined,
    fallbackModel: AI_FALLBACK_MODEL || undefined,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// How long the provider asks us to wait after a 429 (rate limit), capped.
function retryDelayMs(response: Response, body: string): number {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, MAX_RETRY_WAIT_MS);
  const match = body.match(/try again in ([\d.]+)s/i);
  if (match) return Math.min(Math.ceil(Number(match[1]) * 1000), MAX_RETRY_WAIT_MS);
  return 3_000;
}

// Groq calls this "json_validate_failed"; other providers use similar wording.
export function isSchemaMismatch(errorBody: string): boolean {
  return /json_validate_failed|does not match the expected schema/i.test(errorBody);
}

export function createChatClient(config: ChatConfig = readConfigFromEnv()): ChatClient {
  async function send(body: Record<string, unknown>, model = config.model): Promise<Response> {
    return fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
        ...body,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  async function chat(requestBody: Record<string, unknown>): Promise<string> {
    let response = await send(requestBody);

    // Rate limited: switch to the fallback model right away if there is one;
    // otherwise wait as long as the provider asks (max 10 s) and try once more.
    if (response.status === 429) {
      const body = await response.text();
      if (config.fallbackModel) {
        console.warn(`[ai] ${config.model} rate limited, using ${config.fallbackModel}`);
        response = await send(requestBody, config.fallbackModel);
      } else {
        await sleep(retryDelayMs(response, body));
        response = await send(requestBody);
      }
    }

    // The model sometimes produces JSON that breaks the schema; the provider then answers 400.
    // It is random, not caused by the question, so one more try usually works.
    if (response.status === 400) {
      const body = await response.text();
      if (!isSchemaMismatch(body)) throw new Error(`AI request failed (400): ${body}`);
      response = await send(requestBody);
    }

    if (!response.ok) {
      // The body may describe the problem; it never contains our API key.
      throw new Error(`AI request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("AI response has no text content.");
    return content;
  }

  return {
    async completeJson(system, user, schemaName, jsonSchema) {
      const content = await chat({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema: jsonSchema },
        },
      });
      return JSON.parse(content);
    },

    completeText(prompt) {
      return chat({ messages: [{ role: "user", content: prompt }] });
    },
  };
}
