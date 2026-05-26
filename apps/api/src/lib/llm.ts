// llm.ts - Multi-chain LLM client with per-use-case provider fallback
import OpenAI from 'openai';

// ── Individual providers ──────────────────────────────────────────
const hunyuan = {
  name: 'hunyuan',
  client: new OpenAI({
    apiKey: process.env.HUNYUAN_API_KEY!,
    baseURL: process.env.HUNYUAN_BASE_URL || 'https://api.hunyuan.cloud.tencent.com/v1',
  }),
  model: process.env.HUNYUAN_LLM_MODEL || 'hunyuan-turbos-latest',
};

const chatgpt = {
  name: 'chatgpt',
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1',
  }),
  model: process.env.OPENAI_LLM_MODEL || 'gpt-4.1',
};

const deepseek = {
  name: 'deepseek',
  client: new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  }),
  model: process.env.DEEPSEEK_LLM_MODEL || 'deepseek-v4-flash',
};

// ── Named chains (primary → fallback) ────────────────────────────
// profile:  profile summary, monthly chart focus, compare
// daily:    daily guidance
// chat:     chat, conversation summary
const CHAINS = {
  profile: [deepseek, chatgpt],
  daily:   [hunyuan,  deepseek],
  chat:    [chatgpt,  deepseek],
} as const;

export type LLMChain = keyof typeof CHAINS;

const PROVIDER_TIMEOUT_MS = 30_000;

// ── Helpers ───────────────────────────────────────────────────────
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

// ── complete() — buffered, returns full string ────────────────────
export async function complete(
  messages: OpenAI.ChatCompletionMessageParam[],
  chain: LLMChain = 'profile',
): Promise<string> {
  let lastError: unknown;

  for (const provider of CHAINS[chain]) {
    try {
      const t0 = Date.now();
      console.log(`[LLM:${chain}] Trying ${provider.name} model=${provider.model}`);
      const stream = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        stream: true,
      });

      const timeoutErr = Object.assign(
        new Error(`${provider.name} exceeded ${PROVIDER_TIMEOUT_MS}ms`),
        { isProviderTimeout: true },
      );
      const answer = await Promise.race([
        bufferStream(stream),
        new Promise<never>((_, reject) => setTimeout(() => reject(timeoutErr), PROVIDER_TIMEOUT_MS)),
      ]);

      console.log(`[LLM:${chain}] ${provider.name} completed in ${Date.now() - t0}ms (${answer.length} chars)`);
      return answer;

    } catch (err) {
      if (isFallbackable(err)) {
        console.warn(`[LLM:${chain}] ${provider.name} failed, trying next…`, err);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`[LLM:${chain}] All providers failed. Last error: ${lastError}`);
}

// ── streamToWebSocket() — streaming, chat chain only ─────────────
export async function streamToWebSocket(
  messages: OpenAI.ChatCompletionMessageParam[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  let lastError: unknown;

  for (const provider of CHAINS.chat) {
    let tokensSent = 0;
    try {
      console.log(`[LLM:chat] Streaming with provider: ${provider.name}`);
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
        console.warn(`[LLM:chat] ${provider.name} failed before streaming, trying next…`, err);
        lastError = err;
        continue;
      }
      onError(err as Error);
      return;
    }
  }

  onError(new Error(`[LLM:chat] All providers failed. Last error: ${lastError}`));
}
