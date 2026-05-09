// llm.ts - OpenAI-compatible client with DeepSeek → Qwen fallback
import OpenAI from 'openai';

// ── Provider configs ─────────────────────────────────────────────
const PROVIDERS = [
  {
    name: 'deepseek',
    client: new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    }),
    model: process.env.DEEPSEEK_LLM_MODEL || 'deepseek-chat',
  },
  {
    name: 'qwen',
    client: new OpenAI({
      apiKey: process.env.QWEN_API_KEY!,
      baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    }),
    model: process.env.QWEN_LLM_MODEL || 'qwen-plus',
  },
] as const;

// Errors that warrant a fallback — rate limits, server errors, network issues
function isFallbackable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.constructor.name;
  if (name === 'APIConnectionError' || name === 'APIConnectionTimeoutError') return true;
  const status = (err as any).status as number | undefined;
  if (status === 429 || (status !== undefined && status >= 500 && status < 600)) return true;
  return false;
}

// ── complete() — buffered, returns full string ───────────────────
export async function complete(messages: OpenAI.ChatCompletionMessageParam[]): Promise<string> {
  let lastError: unknown;

  for (const provider of PROVIDERS) {
    try {
      console.log(`[LLM] Using provider: ${provider.name}`);
      const stream = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        stream: true,
      });

      let answer = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) answer += delta.content;
      }
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
