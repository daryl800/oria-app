from typing import Dict

MBTI_TYPES = [
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP",
]

MBTI_PROFILES: Dict[str, Dict] = {
    "INTJ": {
        "nickname": {"en": "The Architect", "cn": "策划者"},
        "core_traits": {
            "en": "Strategic, independent, high standards, long-term vision, private",
            "cn": "战略性思维、独立自主、高标准、长远眼光、内敛"
        },
        "strengths": {
            "en": ["Strategic thinking", "Independent", "Decisive", "Determined"],
            "cn": ["战略思维", "独立自主", "果断", "意志坚定"]
        },
        "growth_areas": {
            "en": ["Can seem arrogant", "Overly critical", "Dismissive of emotions"],
            "cn": ["可能显得傲慢", "过于批判", "忽视情感"]
        },
        "work_style": {
            "en": "Thrives with autonomy, complex problems, and long-term projects",
            "cn": "在自主环境、复杂问题和长期项目中表现出色"
        },
        "relationship_style": {
            "en": "Selective, deeply loyal, values intellectual connection",
            "cn": "选择性强、极为忠诚、重视智识连接"
        },
        "bazi_resonance": {
            "en": "Often resonates with strong Metal or Water day masters — precision and depth",
            "cn": "常与金、水日主共鸣——精准与深度"
        }
    },
    "INTP": {
        "nickname": {"en": "The Thinker", "cn": "思考者"},
        "core_traits": {
            "en": "Analytical, objective, reserved, flexible, abstract thinker",
            "cn": "分析型、客观、内敛、灵活、抽象思维"
        },
        "strengths": {
            "en": ["Analytical", "Original thinking", "Open-minded", "Objective"],
            "cn": ["分析能力强", "原创思维", "思想开放", "客观"]
        },
        "growth_areas": {
            "en": ["Indecisive", "Prone to overthinking", "Struggles with routine"],
            "cn": ["优柔寡断", "容易过度思考", "难以适应常规"]
        },
        "work_style": {
            "en": "Excels in research, theory, and independent intellectual work",
            "cn": "在研究、理论和独立智识工作中表现出色"
        },
        "relationship_style": {
            "en": "Values intellectual stimulation, needs personal space",
            "cn": "重视智识刺激，需要个人空间"
        },
        "bazi_resonance": {
            "en": "Often resonates with Water or Wood day masters — flow and curiosity",
            "cn": "常与水、木日主共鸣——流动与好奇"
        }
    },
    "ENTJ": {
        "nickname": {"en": "The Commander", "cn": "指挥官"},
        "core_traits": {
            "en": "Bold, strategic, efficient, natural leader, direct",
            "cn": "大胆、战略性、高效、天生领导者、直接"
        },
        "strengths": {
            "en": ["Leadership", "Strategic planning", "Confident", "Efficient"],
            "cn": ["领导力", "战略规划", "自信", "高效"]
        },
        "growth_areas": {
            "en": ["Impatient", "Domineering", "Intolerant of inefficiency"],
            "cn": ["缺乏耐心", "强势", "对低效零容忍"]
        },
        "work_style": {
            "en": "Thrives in leadership roles with clear goals and authority",
            "cn": "在有明确目标和权威的领导职位中表现出色"
        },
        "relationship_style": {
            "en": "Seeks a partner who is equally ambitious and independent",
            "cn": "寻求同样有抱负和独立的伴侣"
        },
        "bazi_resonance": {
            "en": "Often resonates with strong Fire or Metal day masters — drive and authority",
            "cn": "常与强火、金日主共鸣——动力与权威"
        }
    },
    "ENTP": {
        "nickname": {"en": "The Debater", "cn": "辩论家"},
        "core_traits": {
            "en": "Innovative, strategic, outspoken, charismatic, loves debate",
            "cn": "创新、战略性、直言不讳、有魅力、热爱辩论"
        },
        "strengths": {
            "en": ["Creative", "Quick thinker", "Charismatic", "Knowledgeable"],
            "cn": ["创意丰富", "思维敏捷", "有魅力", "知识渊博"]
        },
        "growth_areas": {
            "en": ["Argumentative", "Insensitive", "Struggles to follow through"],
            "cn": ["好争论", "不够敏感", "难以贯彻执行"]
        },
        "work_style": {
            "en": "Excels in brainstorming, innovation, and entrepreneurial environments",
            "cn": "在头脑风暴、创新和创业环境中表现出色"
        },
        "relationship_style": {
            "en": "Enjoys intellectual sparring, needs a partner who can keep up",
            "cn": "喜欢智识碰撞，需要能跟上自己节奏的伴侣"
        },
        "bazi_resonance": {
            "en": "Often resonates with Wood or Fire day masters — growth and energy",
            "cn": "常与木、火日主共鸣——成长与活力"
        }
    },
    "INFJ": {
        "nickname": {"en": "The Advocate", "cn": "提倡者"},
        "core_traits": {
            "en": "Insightful, principled, compassionate, private, visionary",
            "cn": "洞察力强、有原则、富有同情心、内敛、有远见"
        },
        "strengths": {
            "en": ["Empathetic", "Insightful", "Principled", "Creative"],
            "cn": ["共情能力强", "洞察力强", "有原则", "有创意"]
        },
        "growth_areas": {
            "en": ["Perfectionist", "Prone to burnout", "Overly private"],
            "cn": ["完美主义", "容易倦怠", "过于内敛"]
        },
        "work_style": {
            "en": "Thrives in meaningful work that aligns with personal values",
            "cn": "在与个人价值观一致的有意义工作中表现出色"
        },
        "relationship_style": {
            "en": "Deep, meaningful connections; few but very close relationships",
            "cn": "深度、有意义的连接；朋友不多但极为亲密"
        },
        "bazi_resonance": {
            "en": "Often resonates with Water or Wood day masters — depth and intuition",
            "cn": "常与水、木日主共鸣——深度与直觉"
        }
    },
    "INFP": {
        "nickname": {"en": "The Mediator", "cn": "调停者"},
        "core_traits": {
            "en": "Idealistic, empathetic, creative, reserved, value-driven",
            "cn": "理想主义、富有同情心、有创意、内敛、价值驱动"
        },
        "strengths": {
            "en": ["Empathetic", "Creative", "Passionate", "Idealistic"],
            "cn": ["共情能力强", "有创意", "热情", "理想主义"]
        },
        "growth_areas": {
            "en": ["Overly idealistic", "Self-critical", "Avoids conflict"],
            "cn": ["过于理想化", "自我批判", "回避冲突"]
        },
        "work_style": {
            "en": "Excels in creative, helping, or mission-driven roles",
            "cn": "在创意、助人或使命驱动的角色中表现出色"
        },
        "relationship_style": {
            "en": "Deeply caring, seeks authentic and meaningful connection",
            "cn": "深切关怀，寻求真实而有意义的连接"
        },
        "bazi_resonance": {
            "en": "Often resonates with Wood or Water day masters — growth and sensitivity",
            "cn": "常与木、水日主共鸣——成长与敏感"
        }
    },
    "ENFJ": {
        "nickname": {"en": "The Protagonist", "cn": "主人公"},
        "core_traits": {
            "en": "Charismatic, empathetic, organized, inspiring, people-focused",
            "cn": "有魅力、富有同情心、有条理、鼓舞人心、以人为本"
        },
        "strengths": {
            "en": ["Charismatic", "Empathetic", "Reliable", "Natural leader"],
            "cn": ["有魅力", "共情能力强", "可靠", "天生领导者"]
        },
        "growth_areas": {
            "en": ["Overly idealistic", "Too selfless", "Struggle with criticism"],
            "cn": ["过于理想化", "过于无私", "难以接受批评"]
        },
        "work_style": {
            "en": "Thrives in roles that involve mentoring, leading, and inspiring others",
            "cn": "在涉及指导、领导和激励他人的角色中表现出色"
        },
        "relationship_style": {
            "en": "Warm, nurturing, deeply invested in partner's growth",
            "cn": "温暖、有爱心，深深投入伴侣的成长"
        },
        "bazi_resonance": {
            "en": "Often resonates with Fire or Wood day masters — warmth and growth",
            "cn": "常与火、木日主共鸣——温暖与成长"
        }
    },
    "ENFP": {
        "nickname": {"en": "The Campaigner", "cn": "竞选者"},
        "core_traits": {
            "en": "Enthusiastic, creative, sociable, free-spirited, optimistic",
            "cn": "热情、有创意、善于交际、自由精神、乐观"
        },
        "strengths": {
            "en": ["Enthusiastic", "Creative", "Sociable", "Optimistic"],
            "cn": ["热情", "有创意", "善于交际", "乐观"]
        },
        "growth_areas": {
            "en": ["Unfocused", "Overly emotional", "Struggles with routine"],
            "cn": ["注意力分散", "情绪化", "难以适应常规"]
        },
        "work_style": {
            "en": "Excels in creative, people-oriented, and dynamic environments",
            "cn": "在创意、以人为本和充满活力的环境中表现出色"
        },
        "relationship_style": {
            "en": "Enthusiastic and affectionate, needs freedom and excitement",
            "cn": "热情而深情，需要自由和激情"
        },
        "bazi_resonance": {
            "en": "Often resonates with Fire or Wood day masters — enthusiasm and vitality",
            "cn": "常与火、木日主共鸣——热情与活力"
        }
    },
    "ISTJ": {
        "nickname": {"en": "The Logistician", "cn": "物流师"},
        "core_traits": {
            "en": "Responsible, thorough, dependable, traditional, detail-oriented",
            "cn": "负责任、彻底、可靠、传统、注重细节"
        },
        "strengths": {
            "en": ["Reliable", "Thorough", "Responsible", "Calm under pressure"],
            "cn": ["可靠", "彻底", "负责任", "压力下保持冷静"]
        },
        "growth_areas": {
            "en": ["Stubborn", "Insensitive", "Resistant to change"],
            "cn": ["固执", "不够敏感", "抗拒变化"]
        },
        "work_style": {
            "en": "Excels in structured, rule-based environments with clear expectations",
            "cn": "在有结构、规则明确、期望清晰的环境中表现出色"
        },
        "relationship_style": {
            "en": "Loyal and committed, expresses love through actions not words",
            "cn": "忠诚而专一，通过行动而非言语表达爱意"
        },
        "bazi_resonance": {
            "en": "Often resonates with Metal or Earth day masters — structure and reliability",
            "cn": "常与金、土日主共鸣——结构与可靠"
        }
    },
    "ISFJ": {
        "nickname": {"en": "The Defender", "cn": "守卫者"},
        "core_traits": {
            "en": "Supportive, reliable, patient, observant, enthusiastic",
            "cn": "支持他人、可靠、有耐心、善于观察、热情"
        },
        "strengths": {
            "en": ["Supportive", "Reliable", "Patient", "Detail-oriented"],
            "cn": ["支持他人", "可靠", "有耐心", "注重细节"]
        },
        "growth_areas": {
            "en": ["Overloads themselves", "Reluctant to change", "Too selfless"],
            "cn": ["自我负担过重", "不愿改变", "过于无私"]
        },
        "work_style": {
            "en": "Thrives in supportive, service-oriented roles with clear structure",
            "cn": "在有清晰结构的支持性、服务导向角色中表现出色"
        },
        "relationship_style": {
            "en": "Devoted and caring, prioritizes harmony and stability",
            "cn": "忠诚而关爱，优先考虑和谐与稳定"
        },
        "bazi_resonance": {
            "en": "Often resonates with Earth or Water day masters — nurturing and stability",
            "cn": "常与土、水日主共鸣——滋养与稳定"
        }
    },
    "ESTJ": {
        "nickname": {"en": "The Executive", "cn": "总经理"},
        "core_traits": {
            "en": "Organised, loyal, traditional, direct, strong-willed",
            "cn": "有条理、忠诚、传统、直接、意志坚强"
        },
        "strengths": {
            "en": ["Organised", "Dedicated", "Direct", "Strong-willed"],
            "cn": ["有条理", "敬业", "直接", "意志坚强"]
        },
        "growth_areas": {
            "en": ["Inflexible", "Judgmental", "Difficulty relaxing"],
            "cn": ["缺乏灵活性", "爱评判", "难以放松"]
        },
        "work_style": {
            "en": "Excels in management and leadership with clear processes",
            "cn": "在有清晰流程的管理和领导岗位中表现出色"
        },
        "relationship_style": {
            "en": "Committed and traditional, values stability and clear roles",
            "cn": "专一而传统，重视稳定和明确的角色分工"
        },
        "bazi_resonance": {
            "en": "Often resonates with Metal or Earth day masters — authority and order",
            "cn": "常与金、土日主共鸣——权威与秩序"
        }
    },
    "ESFJ": {
        "nickname": {"en": "The Consul", "cn": "执政官"},
        "core_traits": {
            "en": "Caring, sociable, traditional, loyal, warm-hearted",
            "cn": "关爱他人、善于交际、传统、忠诚、热心肠"
        },
        "strengths": {
            "en": ["Caring", "Loyal", "Sociable", "Practical"],
            "cn": ["关爱他人", "忠诚", "善于交际", "务实"]
        },
        "growth_areas": {
            "en": ["Needy for approval", "Inflexible", "Too selfless"],
            "cn": ["需要认可", "缺乏灵活性", "过于无私"]
        },
        "work_style": {
            "en": "Thrives in collaborative, people-focused environments",
            "cn": "在协作性、以人为本的环境中表现出色"
        },
        "relationship_style": {
            "en": "Warm and devoted, prioritizes harmony and shared values",
            "cn": "温暖而专一，优先考虑和谐与共同价值观"
        },
        "bazi_resonance": {
            "en": "Often resonates with Earth or Fire day masters — warmth and community",
            "cn": "常与土、火日主共鸣——温暖与社群"
        }
    },
    "ISTP": {
        "nickname": {"en": "The Virtuoso", "cn": "鉴赏家"},
        "core_traits": {
            "en": "Practical, observant, analytical, reserved, spontaneous",
            "cn": "务实、善于观察、分析型、内敛、随性"
        },
        "strengths": {
            "en": ["Practical", "Observant", "Calm under pressure", "Hands-on"],
            "cn": ["务实", "善于观察", "压力下保持冷静", "动手能力强"]
        },
        "growth_areas": {
            "en": ["Insensitive", "Private to a fault", "Easily bored"],
            "cn": ["不够敏感", "过于内敛", "容易感到无聊"]
        },
        "work_style": {
            "en": "Excels in technical, hands-on work with freedom to problem-solve",
            "cn": "在有自由解决问题的技术性、实操工作中表现出色"
        },
        "relationship_style": {
            "en": "Independent, needs space, shows love through practical help",
            "cn": "独立自主，需要空间，通过实际帮助表达爱意"
        },
        "bazi_resonance": {
            "en": "Often resonates with Metal or Water day masters — precision and adaptability",
            "cn": "常与金、水日主共鸣——精准与适应力"
        }
    },
    "ISFP": {
        "nickname": {"en": "The Adventurer", "cn": "探险家"},
        "core_traits": {
            "en": "Gentle, sensitive, artistic, spontaneous, present-focused",
            "cn": "温和、敏感、有艺术气质、随性、专注当下"
        },
        "strengths": {
            "en": ["Artistic", "Empathetic", "Flexible", "Charming"],
            "cn": ["有艺术气质", "共情能力强", "灵活", "有魅力"]
        },
        "growth_areas": {
            "en": ["Overly competitive", "Unpredictable", "Easily stressed"],
            "cn": ["过于争强好胜", "难以预测", "容易感到压力"]
        },
        "work_style": {
            "en": "Thrives in creative, flexible roles that allow self-expression",
            "cn": "在允许自我表达的创意性、灵活角色中表现出色"
        },
        "relationship_style": {
            "en": "Warm and spontaneous, values freedom and authentic expression",
            "cn": "温暖而随性，重视自由和真实表达"
        },
        "bazi_resonance": {
            "en": "Often resonates with Wood or Fire day masters — creativity and expression",
            "cn": "常与木、火日主共鸣——创意与表达"
        }
    },
    "ESTP": {
        "nickname": {"en": "The Entrepreneur", "cn": "企业家"},
        "core_traits": {
            "en": "Bold, rational, direct, perceptive, action-oriented",
            "cn": "大胆、理性、直接、洞察力强、行动导向"
        },
        "strengths": {
            "en": ["Bold", "Perceptive", "Direct", "Energetic"],
            "cn": ["大胆", "洞察力强", "直接", "精力充沛"]
        },
        "growth_areas": {
            "en": ["Impatient", "Risk-prone", "Insensitive"],
            "cn": ["缺乏耐心", "冒险倾向", "不够敏感"]
        },
        "work_style": {
            "en": "Excels in fast-paced, dynamic environments with immediate results",
            "cn": "在节奏快、充满活力、立竿见影的环境中表现出色"
        },
        "relationship_style": {
            "en": "Fun and spontaneous, seeks excitement and variety",
            "cn": "有趣而随性，寻求刺激和多样性"
        },
        "bazi_resonance": {
            "en": "Often resonates with Fire or Metal day masters — action and decisiveness",
            "cn": "常与火、金日主共鸣——行动与果断"
        }
    },
    "ESFP": {
        "nickname": {"en": "The Entertainer", "cn": "表演者"},
        "core_traits": {
            "en": "Spontaneous, energetic, enthusiastic, friendly, fun-loving",
            "cn": "随性、精力充沛、热情、友好、热爱生活"
        },
        "strengths": {
            "en": ["Enthusiastic", "Friendly", "Practical", "Observant"],
            "cn": ["热情", "友好", "务实", "善于观察"]
        },
        "growth_areas": {
            "en": ["Easily bored", "Poor long-term planning", "Sensitive to criticism"],
            "cn": ["容易感到无聊", "长期规划能力弱", "对批评敏感"]
        },
        "work_style": {
            "en": "Thrives in people-oriented, hands-on, and entertaining roles",
            "cn": "在以人为本、实操性和娱乐性角色中表现出色"
        },
        "relationship_style": {
            "en": "Affectionate and fun, brings joy and spontaneity to relationships",
            "cn": "深情而有趣，为关系带来欢乐和随性"
        },
        "bazi_resonance": {
            "en": "Often resonates with Fire or Earth day masters — joy and presence",
            "cn": "常与火、土日主共鸣——欢乐与当下"
        }
    },
}

def get_mbti_profile(mbti_type: str, lang: str = "en") -> Dict:
    mbti_type = mbti_type.upper().strip()
    if mbti_type not in MBTI_PROFILES:
        raise ValueError(f"Invalid MBTI type: {mbti_type}. Must be one of {MBTI_TYPES}")
    
    profile = MBTI_PROFILES[mbti_type]
    return {
        "type": mbti_type,
        "nickname": profile["nickname"][lang],
        "core_traits": profile["core_traits"][lang],
        "strengths": profile["strengths"][lang],
        "growth_areas": profile["growth_areas"][lang],
        "work_style": profile["work_style"][lang],
        "relationship_style": profile["relationship_style"][lang],
        "bazi_resonance": profile["bazi_resonance"][lang],
    }

def get_mbti_bazi_combined_context(
    mbti_type: str,
    day_master: str,
    dominant_element: str,
    lang: str = "en"
) -> str:
    mbti = get_mbti_profile(mbti_type, lang)
    
    if lang == "en":
        return (
            f"This person is {mbti_type} ({mbti['nickname']}) — {mbti['core_traits']}. "
            f"Their BaZi day master is {day_master}, with {dominant_element} as the dominant element. "
            f"{mbti['bazi_resonance']}. "
            f"In work, they tend to: {mbti['work_style']}. "
            f"In relationships, they: {mbti['relationship_style']}."
        )
    else:
        return (
            f"此人为{mbti_type}（{mbti['nickname']}）——{mbti['core_traits']}。"
            f"其八字日主为{day_master}，主导五行为{dominant_element}。"
            f"{mbti['bazi_resonance']}。"
            f"工作风格：{mbti['work_style']}。"
            f"感情风格：{mbti['relationship_style']}。"
        )
