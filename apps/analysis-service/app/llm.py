import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

MODEL = "qwen-max"

def get_client() -> OpenAI:
    return OpenAI(
        api_key=os.getenv("QIANWEN_API_KEY"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

def complete(messages: list, max_tokens: int = 1500) -> str:
    client = get_client()
    
    answer_content = ""
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        extra_body={"enable_thinking": True},
        stream=True,
        stream_options={"include_usage": True},
    )

    for chunk in completion:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if hasattr(delta, "content") and delta.content:
            answer_content += delta.content

    return answer_content
