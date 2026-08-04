// llm.ts - Multi-chain LLM client with per-use-case provider fallback

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

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

// ── Provider interface ────────────────────────────────────────────
type TokenStream = AsyncIterable<string>;

interface Provider {
  name: string;
  model: string;
  createStream(messages: OpenAI.ChatCompletionMessageParam[]): Promise<TokenStream>;
  timeoutMs: number;
}

// ── OpenAI-compatible provider factory ───────────────────────────
function openaiProvider(
  name: string,
  client: OpenAI,
  model: string,
  timeoutMs: number,
): Provider {
  return {
    name,
    model,
    timeoutMs,
    async createStream(messages) {
      const raw = await client.chat.completions.create({ model, messages, stream: true });
      async function* tokens(): TokenStream {
        for await (const chunk of raw) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) yield content;
        }
      }
      return tokens();
    },
  };
}

// ── Anthropic provider factory ────────────────────────────────────
function toStr(content: OpenAI.ChatCompletionMessageParam['content']): string {
  if (typeof content === 'string') return content;
  if (content == null) return '';
  return JSON.stringify(content);
}

function anthropicProvider(
  name: string,
  apiKey: string,
  model: string,
  timeoutMs: number,
): Provider {
  const client = new Anthropic({ apiKey });
  return {
    name,
    model,
    timeoutMs,
    async createStream(messages) {
      const system = messages.find(m => m.role === 'system');
      const userMsgs = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: toStr(m.content) }));
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        ...(system ? { system: toStr(system.content) } : {}),
        messages: userMsgs,
      });
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');
      async function* tokens(): TokenStream { await Promise.resolve(); yield text; }
      return tokens();
    },
  };
}

// ── Individual providers ──────────────────────────────────────────
const tencentClient = new OpenAI({
  apiKey: process.env.TENCENT_API_KEY!,
  baseURL: process.env.TENCENT_BASE_URL || 'https://tokenhub.tencentmaas.com/v1',
});

const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const chatgptClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const hunyuan       = openaiProvider('hunyuan',          tencentClient, process.env.TENCENT_HY_LLM_MODEL           || 'Hy3',                  35_000);
const geminiFlashLite = openaiProvider('gemini-flash-lite', geminiClient,  process.env.GEMINI_LLM_MODEL_3_1_flash_lite || 'gemini-3.1-flash-lite', 30_000);

const chatgpt   = openaiProvider('chatgpt',     chatgptClient, process.env.OPENAI_LLM_MODEL   || 'gpt-4.1',       30_000);
const deepseek  = openaiProvider('deepseek',    new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com' }),                          process.env.DEEPSEEK_LLM_MODEL || 'deepseek-v4-flash', 40_000);
const chatgptMini = openaiProvider('chatgpt-mini', chatgptClient, 'gpt-4.1-mini', 30_000);
const gpt4o     = openaiProvider('gpt-4o',      chatgptClient, 'gpt-4o',        30_000);
const gpt4oMini = openaiProvider('gpt-4o-mini', chatgptClient, process.env.DEBATE_WEST_OPENAI_MODEL || 'gpt-4o-mini', 30_000);

const claude = anthropicProvider(
  'claude',
  process.env.ANTHROPIC_API_KEY!,
  process.env.ANTHROPIC_LLM_MODEL || 'claude-sonnet-4-6',
  60_000,
);

// ── Named chains (primary → fallback) ────────────────────────────
export type LLMChain =
  | 'profile' | 'daily' | 'daily_premium' | 'chat'
  | 'debate_east_hunyuan' | 'debate_east_openai' | 'debate_east_gemini_lite' | 'debate_east_deepseek'
  | 'debate_west_openai'  | 'debate_west_hunyuan' | 'debate_west_gemini_lite' | 'debate_west_claude'
  | 'debate_synthesis'
  | 'debate_synthesis_hunyuan' | 'debate_synthesis_gemini_lite' | 'debate_synthesis_openai' | 'debate_synthesis_claude'
  | 'motto_test_hunyuan';

const CHAINS: Record<LLMChain, readonly Provider[]> = {
  profile:               [chatgpt, deepseek, hunyuan],
  daily:                 [deepseek, chatgptMini],
  daily_premium:         [chatgpt, deepseek, chatgptMini],
  chat:                  [chatgpt, deepseek],
  debate_east_hunyuan:      [hunyuan,          gpt4oMini],
  debate_east_openai:       [gpt4oMini,        hunyuan],
  debate_east_gemini_lite:  [geminiFlashLite,  hunyuan],
  debate_east_deepseek:     [deepseek,         hunyuan],
  debate_west_openai:       [gpt4oMini,        hunyuan],
  debate_west_hunyuan:      [hunyuan,          gpt4oMini],
  debate_west_gemini_lite:  [geminiFlashLite,  gpt4oMini],
  debate_west_claude:       [claude,           gpt4oMini],
  debate_synthesis:              [deepseek, gpt4o, chatgpt],
  debate_synthesis_hunyuan:     [hunyuan,         deepseek],
  debate_synthesis_gemini_lite: [geminiFlashLite,  deepseek],
  debate_synthesis_openai:      [gpt4oMini,        deepseek],
  debate_synthesis_claude:      [claude,           gpt4o],
  motto_test_hunyuan:  [hunyuan],
};

// ── Helpers ───────────────────────────────────────────────────────
interface LlmProviderError {
  status?: number;
  code?: unknown;
  isProviderTimeout?: boolean;
}

function toProviderError(err: unknown): LlmProviderError {
  return err !== null && typeof err === 'object' ? (err as LlmProviderError) : {};
}

function isFallbackable(err: unknown): boolean {
  const pe = toProviderError(err);
  if (pe.isProviderTimeout) return true;
  if (!(err instanceof Error)) {
    return typeof pe.status === 'number' && (pe.status === 400 || pe.status === 429 || pe.status >= 500);
  }
  const name = err.constructor.name;
  if (name === 'APIConnectionError' || name === 'APIConnectionTimeoutError') return true;
  const { status } = pe;
  if (status === 400) return true;
  if (status === 429 || (status !== undefined && status >= 500 && status < 600)) return true;
  return false;
}

async function collectTokens(stream: TokenStream): Promise<string> {
  let text = '';
  for await (const token of stream) text += token;
  return text;
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
      console.log(`[LLM:${chain}] Trying ${provider.name}`);

      const timeoutErr = Object.assign(
        new Error(`${provider.name} exceeded ${provider.timeoutMs}ms`),
        { isProviderTimeout: true },
      );
      const text = await Promise.race([
        (async () => collectTokens(await provider.createStream(messages)))(),
        new Promise<never>((_, reject) => setTimeout(() => reject(timeoutErr), provider.timeoutMs)),
      ]);

      console.log(`[LLM:${chain}] ${provider.name} completed in ${Date.now() - t0}ms (${text.length} chars)`);
      return text;

    } catch (err) {
      const pe = toProviderError(err);
      console.error(`[LLM:${chain}] ${provider.name} error:`, {
        type: err instanceof Error ? err.constructor.name : typeof err,
        message: err instanceof Error ? err.message : String(err),
        status: pe.status,
        code: pe.code,
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

  throw new Error(`[LLM:${chain}] All providers failed. Last error: ${String(lastError)}`);
}

// ── completeTracked() — like complete() but also returns provider name ───────
export async function completeTracked(
  messages: OpenAI.ChatCompletionMessageParam[],
  chain: LLMChain = 'profile',
): Promise<{ text: string; provider: string; model: string }> {
  let lastError: unknown;

  for (const provider of CHAINS[chain]) {
    try {
      const t0 = Date.now();
      console.log(`[LLM:${chain}] Trying ${provider.name}`);

      const timeoutErr = Object.assign(
        new Error(`${provider.name} exceeded ${provider.timeoutMs}ms`),
        { isProviderTimeout: true },
      );
      const text = await Promise.race([
        (async () => collectTokens(await provider.createStream(messages)))(),
        new Promise<never>((_, reject) => setTimeout(() => reject(timeoutErr), provider.timeoutMs)),
      ]);

      console.log(`[LLM:${chain}] ${provider.name} completed in ${Date.now() - t0}ms (${text.length} chars)`);
      return { text, provider: provider.name, model: provider.model };

    } catch (err) {
      const pe = toProviderError(err);
      console.error(`[LLM:${chain}] ${provider.name} error:`, {
        type: err instanceof Error ? err.constructor.name : typeof err,
        message: err instanceof Error ? err.message : String(err),
        status: pe.status,
        code: pe.code,
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

  throw new Error(`[LLM:${chain}] All providers failed. Last error: ${String(lastError)}`);
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
      const stream = await provider.createStream(messages);
      for await (const token of stream) {
        onToken(token);
        tokensSent++;
      }
      onDone();
      return;
    } catch (err) {
      if (isFallbackable(err) && tokensSent === 0) {
        console.warn(`[LLM:chat] ${provider.name} failed before streaming, trying next…`, err);
        lastError = err;
        continue;
      }
      onError(err instanceof Error ? err : new Error(String(err)));
      return;
    }
  }

  onError(new Error(`[LLM:chat] All providers failed. Last error: ${String(lastError)}`));
}
