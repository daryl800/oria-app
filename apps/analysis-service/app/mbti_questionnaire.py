from typing import List, Dict

QUESTIONS = [
    # E/I dimension
    {
        "id": 1,
        "dimension": "EI",
        "text_en": "At a social gathering, you tend to:",
        "text_cn": "在社交聚會中，你通常：",
        "options": {
            "A": {"text_en": "Talk to many different people", "text_cn": "與很多不同的人交談", "score": "E"},
            "B": {"text_en": "Stay with a few people you know well", "text_cn": "與幾個熟悉的人待在一起", "score": "I"},
        }
    },
    {
        "id": 2,
        "dimension": "EI",
        "text_en": "After a long day of socializing, you feel:",
        "text_cn": "經過一天的社交活動後，你感到：",
        "options": {
            "A": {"text_en": "Energized and want to continue", "text_cn": "精力充沛，想繼續", "score": "E"},
            "B": {"text_en": "Drained and need alone time", "text_cn": "精疲力竭，需要獨處時間", "score": "I"},
        }
    },
    {
        "id": 3,
        "dimension": "EI",
        "text_en": "You prefer to:",
        "text_cn": "你更傾向於：",
        "options": {
            "A": {"text_en": "Think out loud and discuss ideas with others", "text_cn": "大聲思考，與他人討論想法", "score": "E"},
            "B": {"text_en": "Reflect privately before sharing your thoughts", "text_cn": "先私下思考再分享想法", "score": "I"},
        }
    },
    {
        "id": 4,
        "dimension": "EI",
        "text_en": "In a meeting, you are more likely to:",
        "text_cn": "在會議中，你更可能：",
        "options": {
            "A": {"text_en": "Speak up frequently and share ideas spontaneously", "text_cn": "頻繁發言，自發分享想法", "score": "E"},
            "B": {"text_en": "Listen carefully and speak only when you have something important to say", "text_cn": "認真聆聽，只在有重要事情時才發言", "score": "I"},
        }
    },
    {
        "id": 5,
        "dimension": "EI",
        "text_en": "Your ideal weekend would involve:",
        "text_cn": "你理想的週末會：",
        "options": {
            "A": {"text_en": "Going out and being around people", "text_cn": "外出與人交往", "score": "E"},
            "B": {"text_en": "Staying home and enjoying quiet activities", "text_cn": "待在家裡享受安靜活動", "score": "I"},
        }
    },
    # S/N dimension
    {
        "id": 6,
        "dimension": "SN",
        "text_en": "When learning something new, you prefer:",
        "text_cn": "學習新事物時，你更喜歡：",
        "options": {
            "A": {"text_en": "Step-by-step instructions with practical examples", "text_cn": "按部就班的說明和實際例子", "score": "S"},
            "B": {"text_en": "Understanding the big picture and theory first", "text_cn": "先了解整體概念和理論", "score": "N"},
        }
    },
    {
        "id": 7,
        "dimension": "SN",
        "text_en": "You are more drawn to:",
        "text_cn": "你更傾向於：",
        "options": {
            "A": {"text_en": "What is real and concrete", "text_cn": "真實和具體的事物", "score": "S"},
            "B": {"text_en": "What is possible and imaginative", "text_cn": "可能性和想象力", "score": "N"},
        }
    },
    {
        "id": 8,
        "dimension": "SN",
        "text_en": "When solving a problem, you tend to:",
        "text_cn": "解決問題時，你傾向於：",
        "options": {
            "A": {"text_en": "Use proven methods that have worked before", "text_cn": "使用以前有效的方法", "score": "S"},
            "B": {"text_en": "Come up with new and creative approaches", "text_cn": "想出新穎有創意的方法", "score": "N"},
        }
    },
    {
        "id": 9,
        "dimension": "SN",
        "text_en": "You trust more:",
        "text_cn": "你更信任：",
        "options": {
            "A": {"text_en": "Your direct experience and observations", "text_cn": "你的直接經驗和觀察", "score": "S"},
            "B": {"text_en": "Your gut feelings and hunches", "text_cn": "你的直覺和預感", "score": "N"},
        }
    },
    {
        "id": 10,
        "dimension": "SN",
        "text_en": "You prefer work that:",
        "text_cn": "你更喜歡的工作是：",
        "options": {
            "A": {"text_en": "Has clear, practical outcomes", "text_cn": "有明確實際的成果", "score": "S"},
            "B": {"text_en": "Involves creativity and innovation", "text_cn": "涉及創意和創新", "score": "N"},
        }
    },
    # T/F dimension
    {
        "id": 11,
        "dimension": "TF",
        "text_en": "When making a decision, you prioritize:",
        "text_cn": "做決定時，你優先考慮：",
        "options": {
            "A": {"text_en": "Logic and objective analysis", "text_cn": "邏輯和客觀分析", "score": "T"},
            "B": {"text_en": "How it will affect the people involved", "text_cn": "它將如何影響相關人員", "score": "F"},
        }
    },
    {
        "id": 12,
        "dimension": "TF",
        "text_en": "When a friend comes to you with a problem, you:",
        "text_cn": "當朋友向你傾訴問題時，你：",
        "options": {
            "A": {"text_en": "Help them analyze and find the best solution", "text_cn": "幫助他們分析並找到最佳解決方案", "score": "T"},
            "B": {"text_en": "Listen and offer emotional support first", "text_cn": "先傾聽並提供情感支持", "score": "F"},
        }
    },
    {
        "id": 13,
        "dimension": "TF",
        "text_en": "You believe a good decision is one that:",
        "text_cn": "你認為好的決定是：",
        "options": {
            "A": {"text_en": "Is logically sound and consistent", "text_cn": "邏輯合理且一致", "score": "T"},
            "B": {"text_en": "Considers everyone's feelings and needs", "text_cn": "考慮每個人的感受和需求", "score": "F"},
        }
    },
    {
        "id": 14,
        "dimension": "TF",
        "text_en": "When giving feedback, you tend to be:",
        "text_cn": "給予反饋時，你傾向於：",
        "options": {
            "A": {"text_en": "Direct and honest, even if it's hard to hear", "text_cn": "直接誠實，即使難以聽到", "score": "T"},
            "B": {"text_en": "Diplomatic and considerate of feelings", "text_cn": "外交式的，考慮感受", "score": "F"},
        }
    },
    {
        "id": 15,
        "dimension": "TF",
        "text_en": "You are more proud of your:",
        "text_cn": "你更為以下感到自豪：",
        "options": {
            "A": {"text_en": "Ability to think clearly and analytically", "text_cn": "清晰分析思考的能力", "score": "T"},
            "B": {"text_en": "Empathy and ability to understand others", "text_cn": "同理心和理解他人的能力", "score": "F"},
        }
    },
    # J/P dimension
    {
        "id": 16,
        "dimension": "JP",
        "text_en": "Your workspace or living space is usually:",
        "text_cn": "你的工作或生活空間通常是：",
        "options": {
            "A": {"text_en": "Organized and tidy", "text_cn": "有條理且整潔", "score": "J"},
            "B": {"text_en": "Flexible and somewhat cluttered", "text_cn": "靈活且有些雜亂", "score": "P"},
        }
    },
    {
        "id": 17,
        "dimension": "JP",
        "text_en": "When planning a trip, you prefer to:",
        "text_cn": "計劃旅行時，你更喜歡：",
        "options": {
            "A": {"text_en": "Have a detailed itinerary planned in advance", "text_cn": "提前制定詳細行程", "score": "J"},
            "B": {"text_en": "Keep it flexible and decide as you go", "text_cn": "保持靈活，隨機應變", "score": "P"},
        }
    },
    {
        "id": 18,
        "dimension": "JP",
        "text_en": "When working on a project, you prefer to:",
        "text_cn": "進行項目時，你更喜歡：",
        "options": {
            "A": {"text_en": "Follow a clear plan and stick to deadlines", "text_cn": "遵循明確計劃並遵守截止日期", "score": "J"},
            "B": {"text_en": "Adapt as new information comes in", "text_cn": "隨著新信息的出現而調整", "score": "P"},
        }
    },
    {
        "id": 19,
        "dimension": "JP",
        "text_en": "You feel more comfortable when:",
        "text_cn": "你在以下情況下感到更舒適：",
        "options": {
            "A": {"text_en": "Things are decided and settled", "text_cn": "事情已決定和確定", "score": "J"},
            "B": {"text_en": "Options are still open and flexible", "text_cn": "選項仍然開放和靈活", "score": "P"},
        }
    },
    {
        "id": 20,
        "dimension": "JP",
        "text_en": "Your approach to deadlines is:",
        "text_cn": "你對截止日期的態度是：",
        "options": {
            "A": {"text_en": "Complete tasks well before the deadline", "text_cn": "在截止日期前完成任務", "score": "J"},
            "B": {"text_en": "Work best under last-minute pressure", "text_cn": "在最後期限的壓力下工作最好", "score": "P"},
        }
    },
]

def get_questions(lang: str = "en") -> List[Dict]:
    result = []
    for q in QUESTIONS:
        lang_key = "text_cn" if lang in ("cn", "zh-TW", "zh") else "text_en"
        option_key = "text_cn" if lang in ("cn", "zh-TW", "zh") else "text_en"
        result.append({
            "id": q["id"],
            "dimension": q["dimension"],
            "text": q[lang_key],
            "options": {
                "A": q["options"]["A"][option_key],
                "B": q["options"]["B"][option_key],
            }
        })
    return result

def calculate_mbti(answers: Dict[int, str]) -> Dict:
    scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}

    for q in QUESTIONS:
        answer = answers.get(q["id"])
        if answer in ("A", "B"):
            score_key = q["options"][answer]["score"]
            scores[score_key] += 1

    mbti_type = (
        ("E" if scores["E"] >= scores["I"] else "I") +
        ("S" if scores["S"] >= scores["N"] else "N") +
        ("T" if scores["T"] >= scores["F"] else "F") +
        ("J" if scores["J"] >= scores["P"] else "P")
    )

    return {
        "mbti_type": mbti_type,
        "scores": scores,
        "dimension_results": {
            "EI": {"E": scores["E"], "I": scores["I"], "dominant": "E" if scores["E"] >= scores["I"] else "I"},
            "SN": {"S": scores["S"], "N": scores["N"], "dominant": "S" if scores["S"] >= scores["N"] else "N"},
            "TF": {"T": scores["T"], "F": scores["F"], "dominant": "T" if scores["T"] >= scores["F"] else "F"},
            "JP": {"J": scores["J"], "P": scores["P"], "dominant": "J" if scores["J"] >= scores["P"] else "P"},
        }
    }
