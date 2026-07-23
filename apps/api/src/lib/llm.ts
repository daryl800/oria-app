// llm.ts - Multi-chain LLM client with per-use-case provider fallback

/**
 * Escapes any raw control characters (0x00–0x1F) that appear inside JSON
 * string literals. LLMs occasionally emit literal newlines inside strings,
 * which are invalid JSON and cause JSON.parse to throw.
 */
export function sanitizeLlmJson(raw: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const code = raw.charCodeAt(i);
    if (escaped) { result += c; escaped = false; continue; }
    if (c === '\\' && inString) { result += c; escaped = true; continue; }
    if (c === '"') { inString = !inString; result += c; continue; }
    if (inString && code < 0x20) {
      result += '\\u' + code.toString(16).padStart(4, '0');
      continue;
    }
    result += c;
  }
  return result;
}
import OpenAI from 'openai';

// ── Individual providers ──────────────────────────────────────────
const tencentClient = new OpenAI({
  apiKey: process.env.TENCENT_API_KEY!,
  baseURL: process.env.TENCENT_BASE_URL || 'https://tokenhub.tencentmaas.com/v1',
});

const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const hunyuan        = { name: 'hunyuan',         client: tencentClient, model: process.env.TENCENT_LLM_MODEL             || 'Hy3',                  timeoutMs: 35_000 };
const geminiFlashLite = { name: 'gemini-flash-lite', client: geminiClient,  model: process.env.GEMINI_LLM_MODEL_3_1_flash_lite || 'gemini-3.1-flash-lite', timeoutMs: 30_000 };

const qianwen = {
  name: 'qianwen',
  client: new OpenAI({
    apiKey: process.env.QIANWEN_API_KEY!,
    baseURL: process.env.QIANWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  }),
  model: process.env.QIANWEN_LLM_MODEL || 'qwen-max',
  timeoutMs: 45_000,
};

const chatgpt = {
  name: 'chatgpt',
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  }),
  model: process.env.OPENAI_LLM_MODEL || 'gpt-4.1',
  timeoutMs: 30_000,
};

const deepseek = {
  name: 'deepseek',
  client: new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  }),
  model: process.env.DEEPSEEK_LLM_MODEL || 'deepseek-v4-flash',
  timeoutMs: 60_000,
};

const chatgptMini = {
  name: 'chatgpt-mini',
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  }),
  model: 'gpt-4.1-mini',
  timeoutMs: 30_000,
};

const gpt4o = {
  name: 'gpt-4o',
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  }),
  model: 'gpt-4o',
  timeoutMs: 30_000,
};

const gpt4oMini = {
  name: 'gpt-4o-mini',
  client: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  }),
  model: 'gpt-4o-mini',
  timeoutMs: 30_000,
};

// ── Named chains (primary → fallback) ────────────────────────────
// profile:               profile summary, monthly chart focus, compare
// daily:                 daily guidance (free + plus standard)
// daily_premium:         daily guidance for plus users
// chat:                  chat, conversation summary
// debate_east_hunyuan:   East (BaZi) — Hunyuan only
// debate_west*:          West (MBTI) — model primary, gpt4oMini fallback
// debate_synthesis:      Neutral synthesis — DeepSeek primary
const CHAINS = {
  profile: [deepseek, chatgpt, hunyuan],
  daily: [deepseek, chatgptMini],
  daily_premium: [chatgpt, deepseek, chatgptMini],
  chat: [chatgpt, deepseek],
  debate_east_hunyuan:      [hunyuan,          gpt4oMini],
  debate_east_openai:       [gpt4oMini,        hunyuan],
  debate_east_gemini_lite:  [geminiFlashLite,  hunyuan],
  debate_east_deepseek:     [deepseek,         hunyuan],
  debate_east_qianwen:      [qianwen,          hunyuan],
  debate_west_openai:       [gpt4oMini,        hunyuan],
  debate_west_hunyuan:      [hunyuan,          gpt4oMini],
  debate_west_gemini_lite:  [geminiFlashLite,  gpt4oMini],
  debate_west_deepseek:     [deepseek,         gpt4oMini],
  debate_synthesis: [deepseek, gpt4o, chatgpt],
} as const;

export type LLMChain = keyof typeof CHAINS;

// ── Helpers ───────────────────────────────────────────────────────
function isFallbackable(err: unknown): boolean {
  // Custom timeout flag — checked before instanceof so it always works
  if ((err as any)?.isProviderTimeout) return true;
  // Non-Error objects that still carry a status (some SDK versions, raw fetch errors)
  if (!(err instanceof Error)) {
    const status = (err as any)?.status as number | undefined;
    return status !== undefined && (status === 400 || status === 429 || status >= 500);
  }
  const name = err.constructor.name;
  if (name === 'APIConnectionError' || name === 'APIConnectionTimeoutError') return true;
  const status = (err as any).status as number | undefined;
  if (status === 400) return true;
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
        new Error(`${provider.name} exceeded ${provider.timeoutMs}ms`),
        { isProviderTimeout: true },
      );
      const answer = await Promise.race([
        bufferStream(stream),
        new Promise<never>((_, reject) => setTimeout(() => reject(timeoutErr), provider.timeoutMs)),
      ]);

      console.log(`[LLM:${chain}] ${provider.name} completed in ${Date.now() - t0}ms (${answer.length} chars)`);
      return answer;

    } catch (err) {
      console.error(`[LLM:${chain}] ${provider.name} error:`, {
        type: (err as any)?.constructor?.name,
        message: (err as any)?.message,
        status: (err as any)?.status,
        code: (err as any)?.code,
        isError: err instanceof Error,
      });
      if (isFallbackable(err)) {
        console.warn(`[LLM:${chain}] ${provider.name} failed (fallbackable), trying next…`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`[LLM:${chain}] All providers failed. Last error: ${lastError}`);
}

// ── completeTracked() — like complete() but also returns provider name ───────
export async function completeTracked(
  messages: OpenAI.ChatCompletionMessageParam[],
  chain: LLMChain = 'profile',
): Promise<{ text: string; provider: string }> {
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
        new Error(`${provider.name} exceeded ${provider.timeoutMs}ms`),
        { isProviderTimeout: true },
      );
      const text = await Promise.race([
        bufferStream(stream),
        new Promise<never>((_, reject) => setTimeout(() => reject(timeoutErr), provider.timeoutMs)),
      ]);

      console.log(`[LLM:${chain}] ${provider.name} completed in ${Date.now() - t0}ms (${text.length} chars)`);
      return { text, provider: provider.name };

    } catch (err) {
      console.error(`[LLM:${chain}] ${provider.name} error:`, {
        type: (err as any)?.constructor?.name,
        message: (err as any)?.message,
        status: (err as any)?.status,
        code: (err as any)?.code,
        isError: err instanceof Error,
      });
      if (isFallbackable(err)) {
        console.warn(`[LLM:${chain}] ${provider.name} failed (fallbackable), trying next…`);
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
