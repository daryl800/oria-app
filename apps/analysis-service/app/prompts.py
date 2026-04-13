SAFETY_CLAUSE_EN = """
ABSOLUTE SAFETY RULES — these override everything else:
- Never mention, suggest, imply, or reference death, dying, suicide, self-harm, killing, or harming oneself or others in any form — direct or indirect.
- If the user's message contains any hint of crisis, hopelessness, or self-harm, do NOT continue the reading. Instead respond only with: "I hear that things feel heavy right now. Please reach out to someone who can truly support you — a trusted person in your life, or a professional helpline. You don't have to carry this alone."
- Never use language that implies a person's fate is sealed, their situation is hopeless, or that there is no way forward.
- Never frame any BaZi pattern as a curse, severe misfortune, or irreversible bad luck.
"""

SAFETY_CLAUSE_ZH = """
絕對安全守則——以下規則優先於一切：
- 絕對不得以任何形式——直接或間接——提及、暗示或引導與死亡、自殺、自我傷害、傷害他人相關的內容。
- 若用戶的訊息中出現任何危機、絕望或自我傷害的跡象，請立即停止解讀，並只回應：「我感受到你現在承受著很重的壓力。請聯繫一位你信任的人，或專業的心理支援熱線。你不需要獨自承擔這一切。」
- 絕對不得使用任何暗示命運已定、處境無望或無路可走的語言。
- 絕對不得將任何八字格局描述為詛咒、嚴重厄運或無法改變的壞運。
"""

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "want to die", "don't want to live",
    "harm myself", "self-harm", "no reason to live", "better off dead",
    "自殺", "想死", "不想活", "傷害自己", "了結", "結束生命", "活不下去",
    "no point in living", "tired of living", "can't go on",
    "don't want to be here", "end it all", "disappear forever",
    "nobody would miss me", "better without me",
    "活著沒意思", "不想再撐了", "消失算了", "沒有我更好",
]

def contains_crisis_language(text: str) -> bool:
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in CRISIS_KEYWORDS)

CRISIS_RESPONSE_EN = (
    "I hear that things feel heavy right now. "
    "Please reach out to someone who can truly support you — "
    "a trusted person in your life, or a professional helpline. "
    "You don't have to carry this alone.\n\n"
    "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/"
)

CRISIS_RESPONSE_ZH = (
    "我感受到你現在承受著很重的壓力。"
    "請聯繫一位你信任的人，或專業的心理支援熱線。"
    "你不需要獨自承擔這一切。\n\n"
    "香港撒瑪利亞防止自殺會熱線：2389 2222\n"
    "台灣自殺防治專線：1925"
)

def get_crisis_response(lang: str) -> str:
    return CRISIS_RESPONSE_ZH if lang == "zh-TW" else CRISIS_RESPONSE_EN


def profile_summary_prompt(bazi: dict, mbti: dict, lang: str = "en") -> list:
    if lang == "zh-TW":
        system = f"""你是Oria的引導師——一個溫和、有洞察力的顧問，結合八字和MBTI框架提供反思性的個人指引。
你不做絕對預測。你提供模式、傾向和值得注意的事物。
你的語氣：平靜、紮實、不說教。永遠不說「你必須」或「你會」。
用繁體中文回應。
{SAFETY_CLAUSE_ZH}"""

        user = f"""請根據以下資料，生成一份簡潔的個人檔案摘要。

八字資料：
- 日主：{bazi.get('day_master')}
- 主導五行：{max(bazi.get('five_elements_strength', {}), key=bazi.get('five_elements_strength', {}).get)}
- 五行力量：{bazi.get('five_elements_strength')}

MBTI：{mbti.get('type')} — {mbti.get('nickname')}
核心特質：{mbti.get('core_traits')}

請以JSON格式回應，結構如下：
{{
  "headline": "一句話描述此人的核心本質（15字以內）",
  "summary": "2-3句話的整體描述，結合八字和MBTI的洞察",
  "key_strengths": ["優勢1", "優勢2", "優勢3"],
  "growth_areas": ["成長方向1", "成長方向2"],
  "mbti_bazi_resonance": "一句話說明MBTI和八字如何相互印證",
  "gentle_nudge": "一句溫和的鼓勵或提醒"
}}

只回傳JSON，不要其他文字。"""

    else:
        system = f"""You are Oria's guide — a calm, insightful advisor combining BaZi and MBTI frameworks for reflective personal guidance.
You do not make absolute predictions. You offer patterns, tendencies, and things worth noticing.
Your tone: calm, grounded, non-preachy. Never say "you must" or "you will."
Respond in English.
{SAFETY_CLAUSE_EN}"""

        user = f"""Please generate a concise personal profile summary based on the following data.

BaZi data:
- Day master: {bazi.get('day_master')}
- Dominant element: {max(bazi.get('five_elements_strength', {}), key=bazi.get('five_elements_strength', {}).get)}
- Element strengths: {bazi.get('five_elements_strength')}

MBTI: {mbti.get('type')} — {mbti.get('nickname')}
Core traits: {mbti.get('core_traits')}

Respond in JSON format with this structure:
{{
  "headline": "One sentence capturing this person's core essence (under 15 words)",
  "summary": "2-3 sentences combining BaZi and MBTI insights",
  "key_strengths": ["strength1", "strength2", "strength3"],
  "growth_areas": ["growth area1", "growth area2"],
  "mbti_bazi_resonance": "One sentence on how MBTI and BaZi echo each other",
  "gentle_nudge": "One gentle encouragement or reminder"
}}

Return only the JSON, no other text."""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def daily_guidance_prompt(bazi: dict, today_stem: str, today_branch: str, lang: str = "en") -> list:
    dominant = max(bazi.get('five_elements_strength', {}), key=bazi.get('five_elements_strength', {}).get)

    if lang == "zh-TW":
        system = f"""你是Oria的每日引導師。你根據用戶的八字和今日干支，提供簡短、實用的每日指引。
語氣溫和、積極、不說教。每日指引應在30秒內讀完。
用繁體中文回應。
{SAFETY_CLAUSE_ZH}"""

        user = f"""請根據以下資料生成今日指引。

用戶八字：
- 日主：{bazi.get('day_master')}
- 主導五行：{dominant}
- 五行力量：{bazi.get('five_elements_strength')}

今日干支：{today_stem}{today_branch}

請以JSON格式回應：
{{
  "tone": "今日整體基調（平衡／積極／內省／反思）",
  "pace": "建議節奏（一句話）",
  "helpful_element": {{
    "type": "顏色／環境／心態",
    "value": "具體建議",
    "reason": "簡短原因"
  }},
  "tips": [
    {{"area": "工作", "text": "工作小提示"}},
    {{"area": "人際", "text": "人際小提示"}}
  ],
  "nudge": "今日明燈——一句溫柔的提醒",
  "suggested_prompts": [
    "建議提問1",
    "建議提問2",
    "建議提問3"
  ]
}}

只回傳JSON，不要其他文字。"""

    else:
        system = f"""You are Oria's daily guide. Based on the user's BaZi and today's heavenly stem and earthly branch, you provide a short, practical daily overview.
Tone: gentle, positive, non-preachy. The daily guidance should be readable in under 30 seconds.
Respond in English.
{SAFETY_CLAUSE_EN}"""

        user = f"""Please generate today's guidance based on the following data.

User BaZi:
- Day master: {bazi.get('day_master')}
- Dominant element: {dominant}
- Element strengths: {bazi.get('five_elements_strength')}

Today's stem and branch: {today_stem}{today_branch}

Respond in JSON format:
{{
  "tone": "Today's overall tone (Balanced / Active / Inward / Reflective)",
  "pace": "Suggested pace (one sentence)",
  "helpful_element": {{
    "type": "colour / environment / mindset",
    "value": "specific suggestion",
    "reason": "brief reason"
  }},
  "tips": [
    {{"area": "Work", "text": "work tip"}},
    {{"area": "Relationships", "text": "relationship tip"}}
  ],
  "nudge": "Today's gentle nudge — one sentence",
  "suggested_prompts": [
    "suggested prompt 1",
    "suggested prompt 2",
    "suggested prompt 3"
  ]
}}

Return only the JSON, no other text."""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def chat_prompt(
    bazi: dict,
    mbti: dict,
    history: list,
    user_message: str,
    summary: str = "",
    lang: str = "en"
) -> list:
    if lang == "zh-TW":
        system = f"""你是Oria的引導師——一個溫和、有洞察力的顧問，結合八字和MBTI框架提供反思性的個人指引。
你不做絕對預測。你提供模式、傾向和值得注意的事物。
你的語氣：平靜、紮實、不說教。永遠不說「你必須」或「你會」。

用戶資料：
- 八字日主：{bazi.get('day_master')}
- 主導五行：{max(bazi.get('five_elements_strength', {}), key=bazi.get('five_elements_strength', {}).get)}
- MBTI：{mbti.get('type')} — {mbti.get('nickname')}
- 核心特質：{mbti.get('core_traits')}

每次回應結尾加上：「這是一種反思，而非預測。決定權在你。」
用繁體中文回應。
{SAFETY_CLAUSE_ZH}"""

    else:
        system = f"""You are Oria's guide — a calm, insightful advisor combining BaZi and MBTI frameworks for reflective personal guidance.
You do not make absolute predictions. You offer patterns, tendencies, and things worth noticing.
Your tone: calm, grounded, non-preachy. Never say "you must" or "you will."

User profile:
- BaZi day master: {bazi.get('day_master')}
- Dominant element: {max(bazi.get('five_elements_strength', {}), key=bazi.get('five_elements_strength', {}).get)}
- MBTI: {mbti.get('type')} — {mbti.get('nickname')}
- Core traits: {mbti.get('core_traits')}

End every response with: "This is a reflection, not a prediction. You hold the decisions."
Respond in English.
{SAFETY_CLAUSE_EN}"""

    messages = [{"role": "system", "content": system}]

    if summary:
        messages.append({
            "role": "user",
            "content": f"[Previous conversation summary: {summary}]"
        })
        messages.append({
            "role": "assistant",
            "content": "Understood. I have the context of our earlier conversation."
        })

    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    return messages
