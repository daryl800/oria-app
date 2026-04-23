# Profile Summary Prompt Versions

## Version A — "Trusted Advisor" (conservative)
Add these rules to profileSummaryPrompt instead of current B rules:

9. 每個優勢必須同時指出其「潛在限制或代價」，但語氣需保持溫和
10. 提供一個「人生卡點情境」，描述用戶在什麼具體情況下容易猶豫或停滯
11. 提供一句「人生長期模式」（描述反覆出現的行為傾向）
12. 根據用戶年齡，說明當前人生階段的重心（語氣務實穩重）
13. 吉祥建議至少包含一項「可實際執行的行為」

JSON additions:
"life_pattern": "一句描述長期行為模式（穩重、客觀）",
"friction_point": "一個具體卡住的情境（偏理性描述）"

Target: conservative users, first-time users, skeptics

## Version B — "This is me" (high impact) — CURRENTLY ACTIVE
Rules 9-13 in current prompt.
Target: paying users, believers, depth seekers
