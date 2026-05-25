// llm.ts - OpenAI-compatible client with Hunyuan → ChatGPT fallback
import OpenAI from 'openai';

// ── Provider configs ─────────────────────────────────────────────
const PROVIDERS = [
  {
    name: 'hunyuan',
    client: new OpenAI({
      apiKey: process.env.HUNYUAN_API_KEY!,
      baseURL: process.env.HUNYUAN_BASE_URL || 'https://api.hunyuan.cloud.tencent.com/v1',
    }),
    model: process.env.HUNYUAN_LLM_MODEL || 'hunyuan-turbos-latest',
  },
  {
    name: 'chatgpt',
    client: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: 'https://api.openai.com/v1',
    }),
    model: process.env.OPENAI_LLM_MODEL || 'gpt-4.1',
  },
] as const;

const PROVIDER_TIMEOUT_MS = 30_000;

// Errors that warrant a fallback — rate limits, server errors, network issues, slow providers
function isFallbackable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if ((err as any).isProviderTimeout) return true;
  const name = err.constructor.name;
  if (name === 'APIConnectionError' || name === 'APIConnectionTimeoutError') return true;
  const status = (err as any).status as number | undefined;
  if (status === 429 || (status !== undefined && status >= 500 && status < 600)) return true;
  return false;
}

async function bufferStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>): Promise<string> {
  let answer = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) answer += delta.content;
  }
  return answer;
}

// ── complete() — buffered, returns full string ───────────────────
export async function complete(messages: OpenAI.ChatCompletionMessageParam[], maxTokens?: number): Promise<string> {
  let lastError: unknown;

  for (const provider of PROVIDERS) {
    try {
      const t0 = Date.now();
      console.log(`[LLM] Trying ${provider.name} model=${provider.model}`);
      const stream = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        stream: true,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      });

      const timeoutErr = Object.assign(new Error(`${provider.name} exceeded ${PROVIDER_TIMEOUT_MS}ms`), { isProviderTimeout: true });
      const answer = await Promise.race([
        bufferStream(stream),
        new Promise<never>((_, reject) => setTimeout(() => reject(timeoutErr), PROVIDER_TIMEOUT_MS)),
      ]);

      console.log(`[LLM] ${provider.name} completed in ${Date.now() - t0}ms (${answer.length} chars)`);
      return answer;

    } catch (err) {
      if (isFallbackable(err)) {
        console.warn(`[LLM] ${provider.name} failed, trying next provider…`, err);
        lastError = err;
        continue;
      }
      throw err; // 400/401/403 → don't retry, surface immediately
    }
  }

  throw new Error(`[LLM] All providers failed. Last error: ${lastError}`);
}

// ── streamToWebSocket() — streaming with clean fallback ──────────
export async function streamToWebSocket(
  messages: OpenAI.ChatCompletionMessageParam[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  let lastError: unknown;

  for (const provider of PROVIDERS) {
    let tokensSent = 0;
    try {
      console.log(`[LLM] Streaming with provider: ${provider.name}`);
      const stream = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          onToken(delta.content);
          tokensSent++;
        }
      }
      onDone();
      return;

    } catch (err) {
      if (isFallbackable(err) && tokensSent === 0) {
        console.warn(`[LLM] ${provider.name} failed before streaming, trying next…`, err);
        lastError = err;
        continue;
      }
      // Non-retryable, or failed mid-stream after tokens already sent
      onError(err as Error);
      return;
    }
  }

  onError(new Error(`[LLM] All providers failed. Last error: ${lastError}`));
}
