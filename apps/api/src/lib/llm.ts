import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.QIANWEN_API_KEY!,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const MODEL = 'qwen-max';

export async function complete(messages: OpenAI.ChatCompletionMessageParam[]): Promise<string> {
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
    // @ts-ignore — qianwen-specific extension
    extra_body: { enable_thinking: true },
  });

  let answer = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      answer += delta.content;
    }
  }
  return answer;
}

export async function streamToWebSocket(
  messages: OpenAI.ChatCompletionMessageParam[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      // @ts-ignore
      extra_body: { enable_thinking: true },
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        onToken(delta.content);
      }
    }
    onDone();
  } catch (err) {
    onError(err as Error);
  }
}
