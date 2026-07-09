# mbti_questionnaire.py

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
    "de": "text_de",
    "es": "text_es",
    "fr": "text_fr",
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
        "text_de": "Wenn du Klarheit brauchst, ziehst du es meistens vor:",
        "text_es": "Cuando necesitas claridad, generalmente prefieres:",
        "text_fr": "Quand vous avez besoin de clarté, vous préférez généralement :",
        "options": {
            "A": {
                "text_en": "Talk it through with someone",
                "text_zh_tw": "和別人討論出來",
                "text_zh_cn": "和别人讨论出来",
                "text_ja": "誰かと話し合って整理する",
                "text_ko": "누군가와 이야기하며 정리한다",
                "text_sv": "Prata igenom det med någon",
                "text_de": "Es mit jemandem durchzusprechen",
                "text_es": "Hablarlo con alguien",
                "text_fr": "En parler avec quelqu'un",
                "score": "E"
            },
            "B": {
                "text_en": "Think it through privately first",
                "text_zh_tw": "先自己安靜想清楚",
                "text_zh_cn": "先自己安静想清楚",
                "text_ja": "まず一人で静かに考える",
                "text_ko": "먼저 혼자 조용히 생각한다",
                "text_sv": "Tänka igenom det privat först",
                "text_de": "Es zunächst privat durchzudenken",
                "text_es": "Pensarlo en privado primero",
                "text_fr": "Y réfléchir en privé d'abord",
                "score": "I"
            },
        },
    },
    {
        "id": 2,
        "dimension": "EI",
        "text_en": "After spending time with people you enjoy, you typically feel:",
        "text_zh_tw": "和你喜歡的人相處一段時間後，你通常會感到：",
        "text_zh_cn": "和你喜欢的人相处一段时间后，你通常会感到：",
        "text_ja": "好きな人たちと過ごした後、あなたは通常：",
        "text_ko": "좋아하는 사람들과 시간을 보낸 후, 당신은 보통:",
        "text_sv": "Efter att ha tillbringat tid med människor du gillar, känner du dig vanligtvis:",
        "text_de": "Nachdem du Zeit mit Menschen verbracht hast, die du magst, fühlst du dich typischerweise:",
        "text_es": "Después de pasar tiempo con personas que disfrutas, normalmente te sientes:",
        "text_fr": "Après avoir passé du temps avec des personnes que vous appréciez, vous vous sentez généralement :",
        "options": {
            "A": {
                "text_en": "Energised and happy to keep socialising",
                "text_zh_tw": "充滿活力，還想繼續社交",
                "text_zh_cn": "充满活力，还想继续社交",
                "text_ja": "活力が湧いて、もっと交流したいと感じる",
                "text_ko": "활기가 넘쳐 계속 어울리고 싶다",
                "text_sv": "Energisk och glad att fortsätta umgås",
                "text_de": "Energiegeladen und froh, weiter zu socializen",
                "text_es": "Con energía y con ganas de seguir socializando",
                "text_fr": "Énergisé(e) et heureux(se) de continuer à socialiser",
                "score": "E"
            },
            "B": {
                "text_en": "Satisfied, but ready for some quiet time to yourself",
                "text_zh_tw": "心滿意足，但也需要一些獨處時間",
                "text_zh_cn": "心满意足，但也需要一些独处时间",
                "text_ja": "満足感はあるが、一人の時間が欲しくなる",
                "text_ko": "만족스럽지만 혼자만의 시간이 필요하다",
                "text_sv": "Nöjd men redo för lite tid för dig själv",
                "text_de": "Zufrieden, aber bereit für etwas stille Zeit für dich",
                "text_es": "Satisfecho/a, pero listo/a para un tiempo tranquilo a solas",
                "text_fr": "Satisfait(e), mais prêt(e) pour un peu de temps calme seul(e)",
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
        "text_de": "Du ziehst es vor:",
        "text_es": "Prefieres:",
        "text_fr": "Vous préférez :",
        "options": {
            "A": {
                "text_en": "Think out loud and discuss ideas with others",
                "text_zh_tw": "大聲思考，與他人討論想法",
                "text_zh_cn": "大声思考，与他人讨论想法",
                "text_ja": "声に出して考え、他者とアイデアを議論する",
                "text_ko": "소리 내어 생각하고 다른 사람들과 아이디어를 토론한다",
                "text_sv": "Tänka högt och diskutera idéer med andra",
                "text_de": "Laut zu denken und Ideen mit anderen zu diskutieren",
                "text_es": "Pensar en voz alta y discutir ideas con los demás",
                "text_fr": "Penser à voix haute et discuter des idées avec les autres",
                "score": "E"
            },
            "B": {
                "text_en": "Reflect privately before sharing your thoughts",
                "text_zh_tw": "先私下思考再分享想法",
                "text_zh_cn": "先私下思考再分享想法",
                "text_ja": "考えを共有する前にまず一人で内省する",
                "text_ko": "생각을 나누기 전에 먼저 혼자 성찰한다",
                "text_sv": "Reflektera privat innan du delar dina tankar",
                "text_de": "Privat zu reflektieren, bevor du deine Gedanken teilst",
                "text_es": "Reflexionar en privado antes de compartir tus pensamientos",
                "text_fr": "Réfléchir en privé avant de partager vos pensées",
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
        "text_de": "In einer Besprechung bist du eher geneigt:",
        "text_es": "En una reunión, es más probable que:",
        "text_fr": "En réunion, vous êtes plus susceptible de :",
        "options": {
            "A": {
                "text_en": "Speak up frequently and share ideas spontaneously",
                "text_zh_tw": "頻繁發言，自發分享想法",
                "text_zh_cn": "频繁发言，自发分享想法",
                "text_ja": "頻繁に発言し、自発的にアイデアを共有する",
                "text_ko": "자주 발언하고 자발적으로 아이디어를 공유한다",
                "text_sv": "Tala upp ofta och dela idéer spontant",
                "text_de": "Häufig das Wort zu ergreifen und Ideen spontan zu teilen",
                "text_es": "Hablar frecuentemente y compartir ideas espontáneamente",
                "text_fr": "Prendre la parole fréquemment et partager des idées spontanément",
                "score": "E"
            },
            "B": {
                "text_en": "Listen carefully and speak only when you have something important to say",
                "text_zh_tw": "認真聆聽，只在有重要事情時才發言",
                "text_zh_cn": "认真聆听，只在有重要事情时才发言",
                "text_ja": "注意深く聴き、重要なことがある時だけ発言する",
                "text_ko": "주의 깊게 듣고 중요한 말이 있을 때만 발언한다",
                "text_sv": "Lyssna noga och tala bara när du har något viktigt att säga",
                "text_de": "Sorgfältig zuzuhören und nur zu sprechen, wenn du etwas Wichtiges zu sagen hast",
                "text_es": "Escuchar atentamente y hablar solo cuando tienes algo importante que decir",
                "text_fr": "Écouter attentivement et parler uniquement quand vous avez quelque chose d'important à dire",
                "score": "I"
            },
        }
    },
    {
        "id": 5,
        "dimension": "EI",
        "text_en": "When you imagine your ideal social life, you would prefer:",
        "text_zh_tw": "想像你理想中的社交生活，你更希望：",
        "text_zh_cn": "想象你理想中的社交生活，你更希望：",
        "text_ja": "理想の社会生活を想像するとき、あなたが好むのは：",
        "text_ko": "이상적인 사회생활을 상상할 때, 당신이 선호하는 것은:",
        "text_sv": "När du föreställer dig ditt ideala sociala liv föredrar du:",
        "text_de": "Wenn du dein ideales soziales Leben dir vorstellst, würdest du vorziehen:",
        "text_es": "Cuando imaginas tu vida social ideal, preferirías:",
        "text_fr": "Quand vous imaginez votre vie sociale idéale, vous préféreriez :",
        "options": {
            "A": {
                "text_en": "A full calendar — regular gatherings, meetups, and being around people",
                "text_zh_tw": "行程豐富——經常聚會、約人見面、保持與人的連結",
                "text_zh_cn": "行程丰富——经常聚会、约人见面、保持与人的联结",
                "text_ja": "予定がいっぱい——定期的な集まりや交流で人と繋がっている",
                "text_ko": "가득 찬 일정 — 정기적인 모임과 만남으로 사람들과 함께하는 것",
                "text_sv": "En full kalender — regelbundna sammankomster och att vara bland människor",
                "text_de": "Einen vollen Kalender — regelmäßige Treffen und unter Menschen zu sein",
                "text_es": "Un calendario lleno: reuniones regulares, encuentros y estar rodeado/a de personas",
                "text_fr": "Un agenda chargé — des rassemblements réguliers, des rencontres et être entouré(e) de gens",
                "score": "E"
            },
            "B": {
                "text_en": "A few meaningful connections, with plenty of time to yourself",
                "text_zh_tw": "保持幾個深交知己，以及把大部份時間留給自己",
                "text_zh_cn": "保持几个深交知己，以及把大部分时间留给自己",
                "text_ja": "少数の深い繋がりと、自分だけの時間をたっぷり持つ",
                "text_ko": "소수의 깊은 관계와 충분한 혼자만의 시간",
                "text_sv": "Några meningsfulla relationer och gott om tid för dig själv",
                "text_de": "Wenige bedeutungsvolle Verbindungen mit viel Zeit für dich selbst",
                "text_es": "Pocas conexiones significativas, con mucho tiempo para ti mismo/a",
                "text_fr": "Quelques liens significatifs, avec beaucoup de temps pour vous",
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
        "text_de": "Beim Erlernen von etwas Neuem bevorzugst du:",
        "text_es": "Al aprender algo nuevo, prefieres:",
        "text_fr": "En apprenant quelque chose de nouveau, vous préférez :",
        "options": {
            "A": {
                "text_en": "Step-by-step instructions with practical examples",
                "text_zh_tw": "按部就班的說明和實際例子",
                "text_zh_cn": "按部就班的说明和实际例子",
                "text_ja": "実例を交えたステップバイステップの説明",
                "text_ko": "실제 예시가 있는 단계별 설명",
                "text_sv": "Steg-för-steg-instruktioner med praktiska exempel",
                "text_de": "Schritt-für-Schritt-Anleitungen mit praktischen Beispielen",
                "text_es": "Instrucciones paso a paso con ejemplos prácticos",
                "text_fr": "Des instructions étape par étape avec des exemples pratiques",
                "score": "S"
            },
            "B": {
                "text_en": "Understanding the big picture and theory first",
                "text_zh_tw": "先了解整體概念和理論",
                "text_zh_cn": "先了解整体概念和理论",
                "text_ja": "まず全体像と理論を理解する",
                "text_ko": "먼저 큰 그림과 이론을 이해한다",
                "text_sv": "Förstå helheten och teorin först",
                "text_de": "Zunächst das Gesamtbild und die Theorie zu verstehen",
                "text_es": "Entender el panorama general y la teoría primero",
                "text_fr": "Comprendre d'abord la vue d'ensemble et la théorie",
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
        "text_de": "Du fühlst dich sicherer, wenn Ratschläge basieren auf:",
        "text_es": "Te sientes más seguro/a cuando el consejo se basa en:",
        "text_fr": "Vous vous sentez plus confiant(e) quand un conseil est basé sur :",
        "options": {
            "A": {
                "text_en": "Practical evidence and real examples",
                "text_zh_tw": "實際證據和真實例子",
                "text_zh_cn": "实际证据和真实例子",
                "text_ja": "実際の証拠と具体的な例",
                "text_ko": "실제 증거와 구체적인 사례",
                "text_sv": "Praktiska bevis och verkliga exempel",
                "text_de": "Praktischen Beweisen und realen Beispielen",
                "text_es": "Evidencia práctica y ejemplos reales",
                "text_fr": "Des preuves pratiques et des exemples réels",
                "score": "S"
            },
            "B": {
                "text_en": "A deeper pattern or overall direction",
                "text_zh_tw": "更深層的模式或整體方向",
                "text_zh_cn": "更深层的模式或整体方向",
                "text_ja": "より深いパターンや全体的な方向性",
                "text_ko": "더 깊은 패턴이나 전체적인 방향",
                "text_sv": "Ett djupare mönster eller övergripande riktning",
                "text_de": "Einem tieferen Muster oder einer übergeordneten Richtung",
                "text_es": "Un patrón más profundo o dirección general",
                "text_fr": "Un schéma plus profond ou une direction générale",
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
        "text_de": "Bei der Lösung eines Problems neigst du dazu:",
        "text_es": "Al resolver un problema, tiendes a:",
        "text_fr": "Quand vous résolvez un problème, vous avez tendance à :",
        "options": {
            "A": {
                "text_en": "Use proven methods that have worked before",
                "text_zh_tw": "使用以前有效的方法",
                "text_zh_cn": "使用以前有效的方法",
                "text_ja": "以前うまくいった実績のある方法を使う",
                "text_ko": "이전에 효과가 있었던 검증된 방법을 사용한다",
                "text_sv": "Använda beprövade metoder som fungerat tidigare",
                "text_de": "Bewährte Methoden zu verwenden, die schon früher funktioniert haben",
                "text_es": "Usar métodos probados que han funcionado antes",
                "text_fr": "Utiliser des méthodes éprouvées qui ont fonctionné auparavant",
                "score": "S"
            },
            "B": {
                "text_en": "Come up with new and creative approaches",
                "text_zh_tw": "想出新穎有創意的方法",
                "text_zh_cn": "想出新颖有创意的方法",
                "text_ja": "新しく創造的なアプローチを考え出す",
                "text_ko": "새롭고 창의적인 접근법을 생각해낸다",
                "text_sv": "Komma på nya och kreativa tillvägagångssätt",
                "text_de": "Neue und kreative Ansätze zu entwickeln",
                "text_es": "Buscar enfoques nuevos y creativos",
                "text_fr": "Trouver de nouvelles approches créatives",
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
        "text_de": "Du vertraust mehr:",
        "text_es": "Confías más en:",
        "text_fr": "Vous faites plus confiance à :",
        "options": {
            "A": {
                "text_en": "Your direct experience and observations",
                "text_zh_tw": "你的直接經驗和觀察",
                "text_zh_cn": "你的直接经验和观察",
                "text_ja": "自分の直接の経験と観察",
                "text_ko": "자신의 직접적인 경험과 관찰",
                "text_sv": "Din direkta erfarenhet och observationer",
                "text_de": "Deiner direkten Erfahrung und deinen Beobachtungen",
                "text_es": "Tu experiencia directa y observaciones",
                "text_fr": "Votre expérience directe et vos observations",
                "score": "S"
            },
            "B": {
                "text_en": "Your gut feelings and hunches",
                "text_zh_tw": "你的直覺和預感",
                "text_zh_cn": "你的直觉和预感",
                "text_ja": "直感や予感",
                "text_ko": "직감과 예감",
                "text_sv": "Dina magkänslor och aningar",
                "text_de": "Deinen Bauchgefühlen und Ahnungen",
                "text_es": "Tus corazonadas e intuiciones",
                "text_fr": "Vos intuitions et pressentiments",
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
        "text_de": "Du bevorzugst Arbeit, die:",
        "text_es": "Prefieres trabajo que:",
        "text_fr": "Vous préférez un travail qui :",
        "options": {
            "A": {
                "text_en": "Has clear, practical outcomes",
                "text_zh_tw": "有明確實際的成果",
                "text_zh_cn": "有明确实际的成果",
                "text_ja": "明確で実用的な成果がある",
                "text_ko": "명확하고 실용적인 결과가 있다",
                "text_sv": "Har tydliga, praktiska resultat",
                "text_de": "Klare, praktische Ergebnisse hat",
                "text_es": "Tenga resultados claros y prácticos",
                "text_fr": "A des résultats clairs et pratiques",
                "score": "S"
            },
            "B": {
                "text_en": "Involves creativity and innovation",
                "text_zh_tw": "涉及創意和創新",
                "text_zh_cn": "涉及创意和创新",
                "text_ja": "創造性と革新を含む",
                "text_ko": "창의성과 혁신을 포함한다",
                "text_sv": "Involverar kreativitet och innovation",
                "text_de": "Kreativität und Innovation beinhaltet",
                "text_es": "Implique creatividad e innovación",
                "text_fr": "Implique créativité et innovation",
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
        "text_de": "Bei einer schwierigen Entscheidung neigst du dazu zu fragen:",
        "text_es": "Al tomar una decisión difícil, tiendes a preguntarte:",
        "text_fr": "Quand vous prenez une décision difficile, vous avez tendance à vous demander :",
        "options": {
            "A": {
                "text_en": "What is most logical and fair?",
                "text_zh_tw": "什麼最合理、最公平？",
                "text_zh_cn": "什么最合理、最公平？",
                "text_ja": "何が最も論理的で公平か？",
                "text_ko": "무엇이 가장 논리적이고 공평한가?",
                "text_sv": "Vad är mest logiskt och rättvist?",
                "text_de": "Was ist am logischsten und fairsten?",
                "text_es": "¿Qué es más lógico y justo?",
                "text_fr": "Qu'est-ce qui est le plus logique et équitable ?",
                "score": "T"
            },
            "B": {
                "text_en": "What feels most considerate and humane?",
                "text_zh_tw": "什麼最體貼、最有人情味？",
                "text_zh_cn": "什么最体贴、最有人情味？",
                "text_ja": "何が最も思いやりがあり人道的か？",
                "text_ko": "무엇이 가장 배려 있고 인간적인가?",
                "text_sv": "Vad känns mest hänsynsfullt och humant?",
                "text_de": "Was fühlt sich am rücksichtsvollsten und humansten an?",
                "text_es": "¿Qué se siente más considerado y humano?",
                "text_fr": "Qu'est-ce qui semble le plus attentionné et humain ?",
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
        "text_de": "Wenn jemand ein Problem teilt, ist dein erster Instinkt:",
        "text_es": "Cuando alguien comparte un problema, tu primer instinto es:",
        "text_fr": "Quand quelqu'un partage un problème, votre premier instinct est de :",
        "options": {
            "A": {
                "text_en": "Help clarify the issue and possible solution",
                "text_zh_tw": "幫對方釐清問題和可能解法",
                "text_zh_cn": "帮对方厘清问题和可能解法",
                "text_ja": "問題と解決策を明確にする手助けをする",
                "text_ko": "문제와 가능한 해결책을 명확히 하도록 돕는다",
                "text_sv": "Hjälpa till att klargöra problemet och möjlig lösning",
                "text_de": "Das Problem und mögliche Lösungen zu klären",
                "text_es": "Ayudar a aclarar el problema y la posible solución",
                "text_fr": "Aider à clarifier le problème et la solution possible",
                "score": "T"
            },
            "B": {
                "text_en": "Understand how they feel before moving to solutions",
                "text_zh_tw": "先理解對方的感受，再談解法",
                "text_zh_cn": "先理解对方的感受，再谈解法",
                "text_ja": "解決策に移る前に相手の気持ちを理解する",
                "text_ko": "해결책으로 넘어가기 전에 상대방의 감정을 이해한다",
                "text_sv": "Förstå hur de känner sig innan lösningar diskuteras",
                "text_de": "Zu verstehen, wie sie sich fühlen, bevor du zu Lösungen übergehst",
                "text_es": "Entender cómo se siente antes de pasar a las soluciones",
                "text_fr": "Comprendre comment il/elle se sent avant de passer aux solutions",
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
        "text_de": "Du glaubst, eine gute Entscheidung ist eine, die:",
        "text_es": "Crees que una buena decisión es la que:",
        "text_fr": "Vous croyez qu'une bonne décision est celle qui :",
        "options": {
            "A": {
                "text_en": "Is logically sound and consistent",
                "text_zh_tw": "邏輯合理且一致",
                "text_zh_cn": "逻辑合理且一致",
                "text_ja": "論理的に健全で一貫している",
                "text_ko": "논리적으로 타당하고 일관성이 있다",
                "text_sv": "Är logiskt välgrundat och konsekvent",
                "text_de": "Logisch fundiert und konsequent ist",
                "text_es": "Es lógicamente sólida y coherente",
                "text_fr": "Est logiquement solide et cohérente",
                "score": "T"
            },
            "B": {
                "text_en": "Considers everyone's feelings and needs",
                "text_zh_tw": "考慮每個人的感受和需求",
                "text_zh_cn": "考虑每个人的感受和需求",
                "text_ja": "全員の気持ちとニーズを考慮している",
                "text_ko": "모든 사람의 감정과 필요를 고려한다",
                "text_sv": "Tar hänsyn till allas känslor och behov",
                "text_de": "Die Gefühle und Bedürfnisse aller berücksichtigt",
                "text_es": "Considera los sentimientos y necesidades de todos",
                "text_fr": "Prend en compte les sentiments et les besoins de chacun",
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
        "text_de": "Beim Geben von Feedback neigst du dazu:",
        "text_es": "Al dar retroalimentación, tiendes a ser:",
        "text_fr": "Quand vous donnez un retour, vous avez tendance à être :",
        "options": {
            "A": {
                "text_en": "Direct and honest, even if it's hard to hear",
                "text_zh_tw": "直接誠實，即使難以聽到",
                "text_zh_cn": "直接诚实，即使难以听到",
                "text_ja": "聞きづらくても、率直で正直に伝える",
                "text_ko": "듣기 어렵더라도 직접적이고 솔직하게 말한다",
                "text_sv": "Direkt och ärlig, även om det är svårt att höra",
                "text_de": "Direkt und ehrlich, auch wenn es schwer zu hören ist",
                "text_es": "Directo/a y honesto/a, aunque sea difícil de escuchar",
                "text_fr": "Direct(e) et honnête, même si c'est difficile à entendre",
                "score": "T"
            },
            "B": {
                "text_en": "Diplomatic and considerate of feelings",
                "text_zh_tw": "外交式的，考慮感受",
                "text_zh_cn": "外交式的，考虑感受",
                "text_ja": "外交的で感情に配慮する",
                "text_ko": "외교적이며 감정을 배려한다",
                "text_sv": "Diplomatisk och hänsynsfull mot känslor",
                "text_de": "Diplomatisch und rücksichtsvoll auf Gefühle",
                "text_es": "Diplomático/a y considerado/a con los sentimientos",
                "text_fr": "Diplomatique et attentionné(e) aux sentiments",
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
        "text_de": "Du bist stolzer auf deine:",
        "text_es": "Te sientes más orgulloso/a de tu:",
        "text_fr": "Vous êtes plus fier(ère) de votre :",
        "options": {
            "A": {
                "text_en": "Ability to think clearly and analytically",
                "text_zh_tw": "清晰分析思考的能力",
                "text_zh_cn": "清晰分析思考的能力",
                "text_ja": "明確に分析的に考える能力",
                "text_ko": "명확하고 분석적으로 생각하는 능력",
                "text_sv": "Förmåga att tänka klart och analytiskt",
                "text_de": "Fähigkeit, klar und analytisch zu denken",
                "text_es": "Capacidad de pensar con claridad y analíticamente",
                "text_fr": "Capacité à penser clairement et analytiquement",
                "score": "T"
            },
            "B": {
                "text_en": "Empathy and ability to understand others",
                "text_zh_tw": "同理心和理解他人的能力",
                "text_zh_cn": "同理心和理解他人的能力",
                "text_ja": "共感力と他者を理解する能力",
                "text_ko": "공감 능력과 다른 사람을 이해하는 능력",
                "text_sv": "Empati och förmåga att förstå andra",
                "text_de": "Empathie und Fähigkeit, andere zu verstehen",
                "text_es": "Empatía y capacidad de entender a los demás",
                "text_fr": "Empathie et capacité à comprendre les autres",
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
        "text_de": "Wenn das Leben sich unsicher anfühlt, ziehst du es vor:",
        "text_es": "Cuando la vida se siente incierta, prefieres:",
        "text_fr": "Quand la vie semble incertaine, vous préférez :",
        "options": {
            "A": {
                "text_en": "Create a plan and reduce ambiguity",
                "text_zh_tw": "制定計劃，減少模糊感",
                "text_zh_cn": "制定计划，减少模糊感",
                "text_ja": "計画を立てて曖昧さを減らす",
                "text_ko": "계획을 세우고 모호함을 줄인다",
                "text_sv": "Skapa en plan och minska tvetydighet",
                "text_de": "Einen Plan zu erstellen und Mehrdeutigkeit zu reduzieren",
                "text_es": "Crear un plan y reducir la ambigüedad",
                "text_fr": "Créer un plan et réduire l'ambiguïté",
                "score": "J"
            },
            "B": {
                "text_en": "Stay flexible and adjust as things unfold",
                "text_zh_tw": "保持彈性，邊走邊調整",
                "text_zh_cn": "保持弹性，边走边调整",
                "text_ja": "柔軟に対応し、状況に合わせて調整する",
                "text_ko": "유연하게 상황에 맞게 조정한다",
                "text_sv": "Hålla sig flexibel och anpassa sig allteftersom",
                "text_de": "Flexibel zu bleiben und dich anzupassen",
                "text_es": "Mantenerte flexible y ajustarte según las cosas se desarrollen",
                "text_fr": "Rester flexible et vous adapter au fil des événements",
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
        "text_de": "Du fühlst dich normalerweise besser, wenn:",
        "text_es": "Generalmente te sientes mejor cuando:",
        "text_fr": "Vous vous sentez généralement mieux quand :",
        "options": {
            "A": {
                "text_en": "A decision is made and direction is clear",
                "text_zh_tw": "事情已決定，方向清楚",
                "text_zh_cn": "事情已决定，方向清楚",
                "text_ja": "決断が下され、方向性が明確なとき",
                "text_ko": "결정이 내려지고 방향이 명확할 때",
                "text_sv": "Ett beslut är fattat och riktningen är klar",
                "text_de": "Eine Entscheidung getroffen ist und die Richtung klar ist",
                "text_es": "Se toma una decisión y la dirección está clara",
                "text_fr": "Une décision est prise et la direction est claire",
                "score": "J"
            },
            "B": {
                "text_en": "Options remain open until the timing feels right",
                "text_zh_tw": "選項保持開放，等時機成熟再定",
                "text_zh_cn": "选项保持开放，等时机成熟再定",
                "text_ja": "タイミングが合うまで選択肢が開いているとき",
                "text_ko": "적절한 시기가 될 때까지 선택지가 열려 있을 때",
                "text_sv": "Alternativ förblir öppna tills tidpunkten känns rätt",
                "text_de": "Optionen offen bleiben, bis der Zeitpunkt sich richtig anfühlt",
                "text_es": "Las opciones permanecen abiertas hasta que el momento se siente correcto",
                "text_fr": "Les options restent ouvertes jusqu'à ce que le moment semble propice",
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
        "text_de": "Bei der Arbeit an einem Projekt ziehst du es vor:",
        "text_es": "Al trabajar en un proyecto, prefieres:",
        "text_fr": "Quand vous travaillez sur un projet, vous préférez :",
        "options": {
            "A": {
                "text_en": "Follow a clear plan and stick to deadlines",
                "text_zh_tw": "遵循明確計劃並遵守截止日期",
                "text_zh_cn": "遵循明确计划并遵守截止日期",
                "text_ja": "明確な計画に従い締め切りを守る",
                "text_ko": "명확한 계획을 따르고 마감일을 지킨다",
                "text_sv": "Följa en tydlig plan och hålla deadlines",
                "text_de": "Einem klaren Plan zu folgen und Fristen einzuhalten",
                "text_es": "Seguir un plan claro y cumplir los plazos",
                "text_fr": "Suivre un plan clair et respecter les délais",
                "score": "J"
            },
            "B": {
                "text_en": "Adapt as new information comes in",
                "text_zh_tw": "隨著新信息的出現而調整",
                "text_zh_cn": "随着新信息的出现而调整",
                "text_ja": "新しい情報が入るたびに適応する",
                "text_ko": "새로운 정보가 들어올 때 적응한다",
                "text_sv": "Anpassa sig allteftersom ny information tillkommer",
                "text_de": "Dich anzupassen, wenn neue Informationen eintreffen",
                "text_es": "Adaptarte a medida que llega nueva información",
                "text_fr": "Vous adapter au fur et à mesure que de nouvelles informations arrivent",
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
        "text_de": "Wenn Pläne sich unerwartet ändern, neigst du dazu:",
        "text_es": "Cuando los planes cambian inesperadamente, tiendes a:",
        "text_fr": "Quand les plans changent de façon inattendue, vous avez tendance à :",
        "options": {
            "A": {
                "text_en": "Feel unsettled and want to restore structure",
                "text_zh_tw": "感到不安，並希望重新建立秩序",
                "text_zh_cn": "感到不安，并希望重新建立秩序",
                "text_ja": "落ち着かなくなり、秩序を取り戻したくなる",
                "text_ko": "불안함을 느끼고 질서를 회복하고 싶어한다",
                "text_sv": "Känna dig orolig och vilja återställa struktur",
                "text_de": "Dich unruhig zu fühlen und Struktur wiederherstellen zu wollen",
                "text_es": "Sentirte inquieto/a y querer restaurar la estructura",
                "text_fr": "Vous sentir déstabilisé(e) et vouloir rétablir la structure",
                "score": "J"
            },
            "B": {
                "text_en": "Adapt quickly and go with the new direction",
                "text_zh_tw": "快速調整，順著新的方向走",
                "text_zh_cn": "快速调整，顺着新的方向走",
                "text_ja": "素早く適応し、新しい方向に進む",
                "text_ko": "빠르게 적응하고 새로운 방향으로 나아간다",
                "text_sv": "Anpassa sig snabbt och följa den nya riktningen",
                "text_de": "Dich schnell anzupassen und mit der neuen Richtung zu gehen",
                "text_es": "Adaptarte rápidamente y seguir la nueva dirección",
                "text_fr": "Vous adapter rapidement et suivre la nouvelle direction",
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
        "text_de": "Dein Ansatz zu Fristen ist:",
        "text_es": "Tu enfoque hacia los plazos es:",
        "text_fr": "Votre approche des délais est de :",
        "options": {
            "A": {
                "text_en": "Complete tasks well before the deadline",
                "text_zh_tw": "在截止日期前完成任務",
                "text_zh_cn": "在截止日期前完成任务",
                "text_ja": "締め切りのかなり前に作業を完了させる",
                "text_ko": "마감일 훨씬 전에 작업을 완료한다",
                "text_sv": "Slutföra uppgifter i god tid före deadline",
                "text_de": "Aufgaben weit vor der Frist abzuschließen",
                "text_es": "Completar las tareas mucho antes del plazo",
                "text_fr": "Terminer les tâches bien avant la date limite",
                "score": "J"
            },
            "B": {
                "text_en": "Work best under last-minute pressure",
                "text_zh_tw": "在最後期限的壓力下工作最好",
                "text_zh_cn": "在最后期限的压力下工作最好",
                "text_ja": "土壇場のプレッシャーの下で最もよく機能する",
                "text_ko": "마지막 순간의 압박 아래서 가장 잘 작동한다",
                "text_sv": "Arbeta bäst under sista minuten-press",
                "text_de": "Am besten unter Druck in letzter Minute zu arbeiten",
                "text_es": "Trabajar mejor bajo la presión del último momento",
                "text_fr": "Travailler au mieux sous la pression de la dernière minute",
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