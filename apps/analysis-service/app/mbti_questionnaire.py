from typing import List, Dict

# Language key resolver
LANG_KEYS = {
    "en": "text_en",
    "zh-TW": "text_zh_tw",
    "zh-CN": "text_zh_cn",
    "zh": "text_zh_tw",
    "cn": "text_zh_cn",
    "ja": "text_ja",
    "ko": "text_ko",
    "sv": "text_sv",
}

def get_lang_key(lang: str) -> str:
    return LANG_KEYS.get(lang, "text_en")


QUESTIONS = [
    # E / I — Energy direction
    {
        "id": 1,
        "dimension": "EI",
        "text_en": "When you need clarity, you usually prefer to:",
        "text_zh_tw": "當你需要釐清想法時，你通常會：",
        "text_zh_cn": "当你需要厘清想法时，你通常会：",
        "text_ja": "考えを整理する必要があるとき、あなたは通常：",
        "text_ko": "생각을 정리해야 할 때, 당신은 보통:",
        "text_sv": "När du behöver klarhet föredrar du vanligtvis att:",
        "options": {
            "A": {
                "text_en": "Talk it through with someone",
                "text_zh_tw": "和別人討論出來",
                "text_zh_cn": "和别人讨论出来",
                "text_ja": "誰かと話し合って整理する",
                "text_ko": "누군가와 이야기하며 정리한다",
                "text_sv": "Prata igenom det med någon",
                "score": "E"
            },
            "B": {
                "text_en": "Think it through privately first",
                "text_zh_tw": "先自己安靜想清楚",
                "text_zh_cn": "先自己安静想清楚",
                "text_ja": "まず一人で静かに考える",
                "text_ko": "먼저 혼자 조용히 생각한다",
                "text_sv": "Tänka igenom det privat först",
                "score": "I"
            },
        },
    },
    {
        "id": 2,
        "dimension": "EI",
        "text_en": "After a demanding week, you recover best by:",
        "text_zh_tw": "經過忙碌的一週後，你最能恢復能量的方式是：",
        "text_zh_cn": "经过忙碌的一周后，你最能恢复能量的方式是：",
        "text_ja": "忙しい一週間の後、最も回復できる方法は：",
        "text_ko": "바쁜 한 주가 끝난 후, 가장 잘 회복되는 방법은:",
        "text_sv": "Efter en krävande vecka återhämtar du dig bäst genom att:",
        "options": {
            "A": {
                "text_en": "Being around people or changing environment",
                "text_zh_tw": "和人相處，或轉換環境",
                "text_zh_cn": "和人相处，或转换环境",
                "text_ja": "人と過ごしたり、環境を変えたりする",
                "text_ko": "사람들과 함께하거나 환경을 바꾼다",
                "text_sv": "Vara bland människor eller byta miljö",
                "score": "E"
            },
            "B": {
                "text_en": "Having quiet space and fewer interruptions",
                "text_zh_tw": "有安靜空間，減少被打擾",
                "text_zh_cn": "有安静空间，减少被打扰",
                "text_ja": "静かな空間で邪魔されずに過ごす",
                "text_ko": "조용한 공간에서 방해받지 않고 쉰다",
                "text_sv": "Ha lugnt utrymme med färre avbrott",
                "score": "I"
            },
        },
    },
    {
        "id": 3,
        "dimension": "EI",
        "text_en": "You prefer to:",
        "text_zh_tw": "你更傾向於：",
        "text_zh_cn": "你更倾向于：",
        "text_ja": "あなたは次のどちらを好みますか：",
        "text_ko": "당신은 다음 중 어느 쪽을 선호합니까:",
        "text_sv": "Du föredrar att:",
        "options": {
            "A": {
                "text_en": "Think out loud and discuss ideas with others",
                "text_zh_tw": "大聲思考，與他人討論想法",
                "text_zh_cn": "大声思考，与他人讨论想法",
                "text_ja": "声に出して考え、他者とアイデアを議論する",
                "text_ko": "소리 내어 생각하고 다른 사람들과 아이디어를 토론한다",
                "text_sv": "Tänka högt och diskutera idéer med andra",
                "score": "E"
            },
            "B": {
                "text_en": "Reflect privately before sharing your thoughts",
                "text_zh_tw": "先私下思考再分享想法",
                "text_zh_cn": "先私下思考再分享想法",
                "text_ja": "考えを共有する前にまず一人で内省する",
                "text_ko": "생각을 나누기 전에 먼저 혼자 성찰한다",
                "text_sv": "Reflektera privat innan du delar dina tankar",
                "score": "I"
            },
        }
    },
    {
        "id": 4,
        "dimension": "EI",
        "text_en": "In a meeting, you are more likely to:",
        "text_zh_tw": "在會議中，你更可能：",
        "text_zh_cn": "在会议中，你更可能：",
        "text_ja": "会議の場で、あなたはどちらかというと：",
        "text_ko": "회의에서 당신은 더 자주:",
        "text_sv": "På ett möte är du mer benägen att:",
        "options": {
            "A": {
                "text_en": "Speak up frequently and share ideas spontaneously",
                "text_zh_tw": "頻繁發言，自發分享想法",
                "text_zh_cn": "频繁发言，自发分享想法",
                "text_ja": "頻繁に発言し、自発的にアイデアを共有する",
                "text_ko": "자주 발언하고 자발적으로 아이디어를 공유한다",
                "text_sv": "Tala upp ofta och dela idéer spontant",
                "score": "E"
            },
            "B": {
                "text_en": "Listen carefully and speak only when you have something important to say",
                "text_zh_tw": "認真聆聽，只在有重要事情時才發言",
                "text_zh_cn": "认真聆听，只在有重要事情时才发言",
                "text_ja": "注意深く聴き、重要なことがある時だけ発言する",
                "text_ko": "주의 깊게 듣고 중요한 말이 있을 때만 발언한다",
                "text_sv": "Lyssna noga och tala bara när du har något viktigt att säga",
                "score": "I"
            },
        }
    },
    {
        "id": 5,
        "dimension": "EI",
        "text_en": "Your ideal weekend would involve:",
        "text_zh_tw": "你理想的週末會：",
        "text_zh_cn": "你理想的周末会：",
        "text_ja": "理想の週末は：",
        "text_ko": "이상적인 주말은:",
        "text_sv": "Din ideala helg skulle innebära:",
        "options": {
            "A": {
                "text_en": "Going out and being around people",
                "text_zh_tw": "外出與人交往",
                "text_zh_cn": "外出与人交往",
                "text_ja": "外出して人と過ごす",
                "text_ko": "외출하여 사람들과 함께한다",
                "text_sv": "Att gå ut och umgås med människor",
                "score": "E"
            },
            "B": {
                "text_en": "Staying home and enjoying quiet activities",
                "text_zh_tw": "待在家裡享受安靜活動",
                "text_zh_cn": "待在家里享受安静活动",
                "text_ja": "家で静かな活動を楽しむ",
                "text_ko": "집에서 조용한 활동을 즐긴다",
                "text_sv": "Stanna hemma och njuta av lugna aktiviteter",
                "score": "I"
            },
        }
    },
    # S / N — Information style
    {
        "id": 6,
        "dimension": "SN",
        "text_en": "When learning something new, you prefer:",
        "text_zh_tw": "學習新事物時，你更喜歡：",
        "text_zh_cn": "学习新事物时，你更喜欢：",
        "text_ja": "新しいことを学ぶとき、あなたが好むのは：",
        "text_ko": "새로운 것을 배울 때 당신이 선호하는 것은:",
        "text_sv": "När du lär dig något nytt föredrar du:",
        "options": {
            "A": {
                "text_en": "Step-by-step instructions with practical examples",
                "text_zh_tw": "按部就班的說明和實際例子",
                "text_zh_cn": "按部就班的说明和实际例子",
                "text_ja": "実例を交えたステップバイステップの説明",
                "text_ko": "실제 예시가 있는 단계별 설명",
                "text_sv": "Steg-för-steg-instruktioner med praktiska exempel",
                "score": "S"
            },
            "B": {
                "text_en": "Understanding the big picture and theory first",
                "text_zh_tw": "先了解整體概念和理論",
                "text_zh_cn": "先了解整体概念和理论",
                "text_ja": "まず全体像と理論を理解する",
                "text_ko": "먼저 큰 그림과 이론을 이해한다",
                "text_sv": "Förstå helheten och teorin först",
                "score": "N"
            },
        }
    },
    {
        "id": 7,
        "dimension": "SN",
        "text_en": "You feel more confident when advice is based on:",
        "text_zh_tw": "你較信任以下哪種建議：",
        "text_zh_cn": "你较信任以下哪种建议：",
        "text_ja": "どちらのアドバイスをより信頼しますか：",
        "text_ko": "어떤 조언을 더 신뢰합니까:",
        "text_sv": "Du känner dig mer trygg när råd är baserade på:",
        "options": {
            "A": {
                "text_en": "Practical evidence and real examples",
                "text_zh_tw": "實際證據和真實例子",
                "text_zh_cn": "实际证据和真实例子",
                "text_ja": "実際の証拠と具体的な例",
                "text_ko": "실제 증거와 구체적인 사례",
                "text_sv": "Praktiska bevis och verkliga exempel",
                "score": "S"
            },
            "B": {
                "text_en": "A deeper pattern or overall direction",
                "text_zh_tw": "更深層的模式或整體方向",
                "text_zh_cn": "更深层的模式或整体方向",
                "text_ja": "より深いパターンや全体的な方向性",
                "text_ko": "더 깊은 패턴이나 전체적인 방향",
                "text_sv": "Ett djupare mönster eller övergripande riktning",
                "score": "N"
            },
        },
    },
    {
        "id": 8,
        "dimension": "SN",
        "text_en": "When solving a problem, you tend to:",
        "text_zh_tw": "解決問題時，你傾向於：",
        "text_zh_cn": "解决问题时，你倾向于：",
        "text_ja": "問題を解決するとき、あなたは：",
        "text_ko": "문제를 해결할 때 당신은:",
        "text_sv": "När du löser ett problem tenderar du att:",
        "options": {
            "A": {
                "text_en": "Use proven methods that have worked before",
                "text_zh_tw": "使用以前有效的方法",
                "text_zh_cn": "使用以前有效的方法",
                "text_ja": "以前うまくいった実績のある方法を使う",
                "text_ko": "이전에 효과가 있었던 검증된 방법을 사용한다",
                "text_sv": "Använda beprövade metoder som fungerat tidigare",
                "score": "S"
            },
            "B": {
                "text_en": "Come up with new and creative approaches",
                "text_zh_tw": "想出新穎有創意的方法",
                "text_zh_cn": "想出新颖有创意的方法",
                "text_ja": "新しく創造的なアプローチを考え出す",
                "text_ko": "새롭고 창의적인 접근법을 생각해낸다",
                "text_sv": "Komma på nya och kreativa tillvägagångssätt",
                "score": "N"
            },
        }
    },
    {
        "id": 9,
        "dimension": "SN",
        "text_en": "You trust more:",
        "text_zh_tw": "你更信任：",
        "text_zh_cn": "你更信任：",
        "text_ja": "あなたがより信頼するのは：",
        "text_ko": "당신이 더 신뢰하는 것은:",
        "text_sv": "Du litar mer på:",
        "options": {
            "A": {
                "text_en": "Your direct experience and observations",
                "text_zh_tw": "你的直接經驗和觀察",
                "text_zh_cn": "你的直接经验和观察",
                "text_ja": "自分の直接の経験と観察",
                "text_ko": "자신의 직접적인 경험과 관찰",
                "text_sv": "Din direkta erfarenhet och observationer",
                "score": "S"
            },
            "B": {
                "text_en": "Your gut feelings and hunches",
                "text_zh_tw": "你的直覺和預感",
                "text_zh_cn": "你的直觉和预感",
                "text_ja": "直感や予感",
                "text_ko": "직감과 예감",
                "text_sv": "Dina magkänslor och aningar",
                "score": "N"
            },
        }
    },
    {
        "id": 10,
        "dimension": "SN",
        "text_en": "You prefer work that:",
        "text_zh_tw": "你更喜歡的工作是：",
        "text_zh_cn": "你更喜欢的工作是：",
        "text_ja": "あなたが好む仕事は：",
        "text_ko": "당신이 선호하는 업무는:",
        "text_sv": "Du föredrar arbete som:",
        "options": {
            "A": {
                "text_en": "Has clear, practical outcomes",
                "text_zh_tw": "有明確實際的成果",
                "text_zh_cn": "有明确实际的成果",
                "text_ja": "明確で実用的な成果がある",
                "text_ko": "명확하고 실용적인 결과가 있다",
                "text_sv": "Har tydliga, praktiska resultat",
                "score": "S"
            },
            "B": {
                "text_en": "Involves creativity and innovation",
                "text_zh_tw": "涉及創意和創新",
                "text_zh_cn": "涉及创意和创新",
                "text_ja": "創造性と革新を含む",
                "text_ko": "창의성과 혁신을 포함한다",
                "text_sv": "Involverar kreativitet och innovation",
                "score": "N"
            },
        }
    },
    # T / F — Decision priority
    {
        "id": 11,
        "dimension": "TF",
        "text_en": "When making a difficult decision, you tend to ask:",
        "text_zh_tw": "做困難決定時，你通常會問自己：",
        "text_zh_cn": "做困难决定时，你通常会问自己：",
        "text_ja": "難しい決断をするとき、あなたは自問します：",
        "text_ko": "어려운 결정을 내릴 때, 당신은 스스로에게 묻습니다:",
        "text_sv": "När du fattar ett svårt beslut tenderar du att fråga:",
        "options": {
            "A": {
                "text_en": "What is most logical and fair?",
                "text_zh_tw": "什麼最合理、最公平？",
                "text_zh_cn": "什么最合理、最公平？",
                "text_ja": "何が最も論理的で公平か？",
                "text_ko": "무엇이 가장 논리적이고 공평한가?",
                "text_sv": "Vad är mest logiskt och rättvist?",
                "score": "T"
            },
            "B": {
                "text_en": "What feels most considerate and humane?",
                "text_zh_tw": "什麼最體貼、最有人情味？",
                "text_zh_cn": "什么最体贴、最有人情味？",
                "text_ja": "何が最も思いやりがあり人道的か？",
                "text_ko": "무엇이 가장 배려 있고 인간적인가?",
                "text_sv": "Vad känns mest hänsynsfullt och humant?",
                "score": "F"
            },
        },
    },
    {
        "id": 12,
        "dimension": "TF",
        "text_en": "When someone shares a problem, your first instinct is to:",
        "text_zh_tw": "當別人向你訴說問題時，你的第一反應是：",
        "text_zh_cn": "当别人向你诉说问题时，你的第一反应是：",
        "text_ja": "誰かが問題を話してくれたとき、最初の本能は：",
        "text_ko": "누군가 문제를 털어놓을 때, 당신의 첫 번째 본능은:",
        "text_sv": "När någon delar ett problem är ditt första instinkt att:",
        "options": {
            "A": {
                "text_en": "Help clarify the issue and possible solution",
                "text_zh_tw": "幫對方釐清問題和可能解法",
                "text_zh_cn": "帮对方厘清问题和可能解法",
                "text_ja": "問題と解決策を明確にする手助けをする",
                "text_ko": "문제와 가능한 해결책을 명확히 하도록 돕는다",
                "text_sv": "Hjälpa till att klargöra problemet och möjlig lösning",
                "score": "T"
            },
            "B": {
                "text_en": "Understand how they feel before moving to solutions",
                "text_zh_tw": "先理解對方的感受，再談解法",
                "text_zh_cn": "先理解对方的感受，再谈解法",
                "text_ja": "解決策に移る前に相手の気持ちを理解する",
                "text_ko": "해결책으로 넘어가기 전에 상대방의 감정을 이해한다",
                "text_sv": "Förstå hur de känner sig innan lösningar diskuteras",
                "score": "F"
            },
        },
    },
    {
        "id": 13,
        "dimension": "TF",
        "text_en": "You believe a good decision is one that:",
        "text_zh_tw": "你認為好的決定是：",
        "text_zh_cn": "你认为好的决定是：",
        "text_ja": "良い決断とは：",
        "text_ko": "좋은 결정이란:",
        "text_sv": "Du tror att ett bra beslut är ett som:",
        "options": {
            "A": {
                "text_en": "Is logically sound and consistent",
                "text_zh_tw": "邏輯合理且一致",
                "text_zh_cn": "逻辑合理且一致",
                "text_ja": "論理的に健全で一貫している",
                "text_ko": "논리적으로 타당하고 일관성이 있다",
                "text_sv": "Är logiskt välgrundat och konsekvent",
                "score": "T"
            },
            "B": {
                "text_en": "Considers everyone's feelings and needs",
                "text_zh_tw": "考慮每個人的感受和需求",
                "text_zh_cn": "考虑每个人的感受和需求",
                "text_ja": "全員の気持ちとニーズを考慮している",
                "text_ko": "모든 사람의 감정과 필요를 고려한다",
                "text_sv": "Tar hänsyn till allas känslor och behov",
                "score": "F"
            },
        }
    },
    {
        "id": 14,
        "dimension": "TF",
        "text_en": "When giving feedback, you tend to be:",
        "text_zh_tw": "給予反饋時，你傾向於：",
        "text_zh_cn": "给予反馈时，你倾向于：",
        "text_ja": "フィードバックをするとき、あなたは：",
        "text_ko": "피드백을 줄 때 당신은:",
        "text_sv": "När du ger feedback tenderar du att vara:",
        "options": {
            "A": {
                "text_en": "Direct and honest, even if it's hard to hear",
                "text_zh_tw": "直接誠實，即使難以聽到",
                "text_zh_cn": "直接诚实，即使难以听到",
                "text_ja": "聞きづらくても、率直で正直に伝える",
                "text_ko": "듣기 어렵더라도 직접적이고 솔직하게 말한다",
                "text_sv": "Direkt och ärlig, även om det är svårt att höra",
                "score": "T"
            },
            "B": {
                "text_en": "Diplomatic and considerate of feelings",
                "text_zh_tw": "外交式的，考慮感受",
                "text_zh_cn": "外交式的，考虑感受",
                "text_ja": "外交的で感情に配慮する",
                "text_ko": "외교적이며 감정을 배려한다",
                "text_sv": "Diplomatisk och hänsynsfull mot känslor",
                "score": "F"
            },
        }
    },
    {
        "id": 15,
        "dimension": "TF",
        "text_en": "You are more proud of your:",
        "text_zh_tw": "你更為以下感到自豪：",
        "text_zh_cn": "你更为以下感到自豪：",
        "text_ja": "あなたがより誇りに思うのは：",
        "text_ko": "당신이 더 자랑스럽게 여기는 것은:",
        "text_sv": "Du är mer stolt över din:",
        "options": {
            "A": {
                "text_en": "Ability to think clearly and analytically",
                "text_zh_tw": "清晰分析思考的能力",
                "text_zh_cn": "清晰分析思考的能力",
                "text_ja": "明確に分析的に考える能力",
                "text_ko": "명확하고 분석적으로 생각하는 능력",
                "text_sv": "Förmåga att tänka klart och analytiskt",
                "score": "T"
            },
            "B": {
                "text_en": "Empathy and ability to understand others",
                "text_zh_tw": "同理心和理解他人的能力",
                "text_zh_cn": "同理心和理解他人的能力",
                "text_ja": "共感力と他者を理解する能力",
                "text_ko": "공감 능력과 다른 사람을 이해하는 능력",
                "text_sv": "Empati och förmåga att förstå andra",
                "score": "F"
            },
        }
    },
    # J / P — Structure style
    {
        "id": 16,
        "dimension": "JP",
        "text_en": "When life feels uncertain, you prefer to:",
        "text_zh_tw": "當生活充滿不確定時，你較傾向：",
        "text_zh_cn": "当生活充满不确定时，你较倾向：",
        "text_ja": "生活が不確かに感じるとき、あなたは：",
        "text_ko": "삶이 불확실하게 느껴질 때, 당신은:",
        "text_sv": "När livet känns osäkert föredrar du att:",
        "options": {
            "A": {
                "text_en": "Create a plan and reduce ambiguity",
                "text_zh_tw": "制定計劃，減少模糊感",
                "text_zh_cn": "制定计划，减少模糊感",
                "text_ja": "計画を立てて曖昧さを減らす",
                "text_ko": "계획을 세우고 모호함을 줄인다",
                "text_sv": "Skapa en plan och minska tvetydighet",
                "score": "J"
            },
            "B": {
                "text_en": "Stay flexible and adjust as things unfold",
                "text_zh_tw": "保持彈性，邊走邊調整",
                "text_zh_cn": "保持弹性，边走边调整",
                "text_ja": "柔軟に対応し、状況に合わせて調整する",
                "text_ko": "유연하게 상황에 맞게 조정한다",
                "text_sv": "Hålla sig flexibel och anpassa sig allteftersom",
                "score": "P"
            },
        },
    },
    {
        "id": 17,
        "dimension": "JP",
        "text_en": "You usually feel better when:",
        "text_zh_tw": "你通常在以下情況會更安心：",
        "text_zh_cn": "你通常在以下情况会更安心：",
        "text_ja": "あなたが安心するのは：",
        "text_ko": "당신이 더 안심되는 때는:",
        "text_sv": "Du känner dig vanligtvis bättre när:",
        "options": {
            "A": {
                "text_en": "A decision is made and direction is clear",
                "text_zh_tw": "事情已決定，方向清楚",
                "text_zh_cn": "事情已决定，方向清楚",
                "text_ja": "決断が下され、方向性が明確なとき",
                "text_ko": "결정이 내려지고 방향이 명확할 때",
                "text_sv": "Ett beslut är fattat och riktningen är klar",
                "score": "J"
            },
            "B": {
                "text_en": "Options remain open until the timing feels right",
                "text_zh_tw": "選項保持開放，等時機成熟再定",
                "text_zh_cn": "选项保持开放，等时机成熟再定",
                "text_ja": "タイミングが合うまで選択肢が開いているとき",
                "text_ko": "적절한 시기가 될 때까지 선택지가 열려 있을 때",
                "text_sv": "Alternativ förblir öppna tills tidpunkten känns rätt",
                "score": "P"
            },
        },
    },
    {
        "id": 18,
        "dimension": "JP",
        "text_en": "When working on a project, you prefer to:",
        "text_zh_tw": "進行項目時，你更喜歡：",
        "text_zh_cn": "进行项目时，你更喜欢：",
        "text_ja": "プロジェクトに取り組むとき、あなたは：",
        "text_ko": "프로젝트를 진행할 때 당신은:",
        "text_sv": "När du arbetar med ett projekt föredrar du att:",
        "options": {
            "A": {
                "text_en": "Follow a clear plan and stick to deadlines",
                "text_zh_tw": "遵循明確計劃並遵守截止日期",
                "text_zh_cn": "遵循明确计划并遵守截止日期",
                "text_ja": "明確な計画に従い締め切りを守る",
                "text_ko": "명확한 계획을 따르고 마감일을 지킨다",
                "text_sv": "Följa en tydlig plan och hålla deadlines",
                "score": "J"
            },
            "B": {
                "text_en": "Adapt as new information comes in",
                "text_zh_tw": "隨著新信息的出現而調整",
                "text_zh_cn": "随着新信息的出现而调整",
                "text_ja": "新しい情報が入るたびに適応する",
                "text_ko": "새로운 정보가 들어올 때 적응한다",
                "text_sv": "Anpassa sig allteftersom ny information tillkommer",
                "score": "P"
            },
        }
    },
    {
        "id": 19,
        "dimension": "JP",
        "text_en": "When plans change unexpectedly, you tend to:",
        "text_zh_tw": "當計劃突然改變時，你通常會：",
        "text_zh_cn": "当计划突然改变时，你通常会：",
        "text_ja": "計画が突然変わったとき、あなたは：",
        "text_ko": "계획이 갑자기 바뀔 때 당신은:",
        "text_sv": "När planer förändras oväntat tenderar du att:",
        "options": {
            "A": {
                "text_en": "Feel unsettled and want to restore structure",
                "text_zh_tw": "感到不安，並希望重新建立秩序",
                "text_zh_cn": "感到不安，并希望重新建立秩序",
                "text_ja": "落ち着かなくなり、秩序を取り戻したくなる",
                "text_ko": "불안함을 느끼고 질서를 회복하고 싶어한다",
                "text_sv": "Känna dig orolig och vilja återställa struktur",
                "score": "J"
            },
            "B": {
                "text_en": "Adapt quickly and go with the new direction",
                "text_zh_tw": "快速調整，順著新的方向走",
                "text_zh_cn": "快速调整，顺着新的方向走",
                "text_ja": "素早く適応し、新しい方向に進む",
                "text_ko": "빠르게 적응하고 새로운 방향으로 나아간다",
                "text_sv": "Anpassa sig snabbt och följa den nya riktningen",
                "score": "P"
            },
        },
    },
    {
        "id": 20,
        "dimension": "JP",
        "text_en": "Your approach to deadlines is:",
        "text_zh_tw": "你對截止日期的態度是：",
        "text_zh_cn": "你对截止日期的态度是：",
        "text_ja": "締め切りに対するあなたのスタンスは：",
        "text_ko": "마감일에 대한 당신의 태도는:",
        "text_sv": "Din inställning till deadlines är:",
        "options": {
            "A": {
                "text_en": "Complete tasks well before the deadline",
                "text_zh_tw": "在截止日期前完成任務",
                "text_zh_cn": "在截止日期前完成任务",
                "text_ja": "締め切りのかなり前に作業を完了させる",
                "text_ko": "마감일 훨씬 전에 작업을 완료한다",
                "text_sv": "Slutföra uppgifter i god tid före deadline",
                "score": "J"
            },
            "B": {
                "text_en": "Work best under last-minute pressure",
                "text_zh_tw": "在最後期限的壓力下工作最好",
                "text_zh_cn": "在最后期限的压力下工作最好",
                "text_ja": "土壇場のプレッシャーの下で最もよく機能する",
                "text_ko": "마지막 순간의 압박 아래서 가장 잘 작동한다",
                "text_sv": "Arbeta bäst under sista minuten-press",
                "score": "P"
            },
        }
    },
]


def get_questions(lang: str = "en") -> List[Dict]:
    key = get_lang_key(lang)
    result = []
    for q in QUESTIONS:
        result.append({
            "id": q["id"],
            "dimension": q["dimension"],
            "text": q.get(key, q["text_en"]),
            "options": {
                "A": q["options"]["A"].get(key, q["options"]["A"]["text_en"]),
                "B": q["options"]["B"].get(key, q["options"]["B"]["text_en"]),
            }
        })
    return result


def get_dimension_result(a, b, a_label, b_label):
    if a > b:
        dominant = a_label
    elif b > a:
        dominant = b_label
    else:
        dominant = None  # tie

    confidence = abs(a - b)

    return {
        a_label: a,
        b_label: b,
        "dominant": dominant,
        "confidence": confidence
    }


def pick_letter(result, fallback):
    return result["dominant"] if result["dominant"] else fallback


def calculate_mbti(answers: Dict[int, str]) -> Dict:
    scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}

    for q in QUESTIONS:
        answer = answers.get(q["id"])
        if answer in ("A", "B"):
            score_key = q["options"][answer]["score"]
            scores[score_key] += 1

    dimension_results = {
        "EI": get_dimension_result(scores["E"], scores["I"], "E", "I"),
        "SN": get_dimension_result(scores["S"], scores["N"], "S", "N"),
        "TF": get_dimension_result(scores["T"], scores["F"], "T", "F"),
        "JP": get_dimension_result(scores["J"], scores["P"], "J", "P"),
    }

    mbti_type = (
        pick_letter(dimension_results["EI"], "I") +
        pick_letter(dimension_results["SN"], "N") +
        pick_letter(dimension_results["TF"], "F") +
        pick_letter(dimension_results["JP"], "P")
    )

    return {
        "mbti_type": mbti_type,
        "scores": scores,
        "dimension_results": dimension_results
    }