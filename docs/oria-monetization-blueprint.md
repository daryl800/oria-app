# Oria MVP Monetization Blueprint

## Philosophy
Ship fast, learn what users pay for, iterate. Avoid over-engineering before validation.

---

## Payment Provider
**Stripe Payment Links** — no code integration needed for MVP. Create a payment link in Stripe dashboard and paste the URL into the app.

---

## Pricing Model
**Single Pro subscription — $9.99/month**

Simple. One decision for the user. Easy to explain.

---

## Feature Tiers

### Free (永遠免費)
| Feature | Description |
|---------|-------------|
| Onboarding | Full MBTI quiz + BaZi birthday input |
| Basic Chart | 四柱, 五行力量, MBTI dimension bars |
| Daily Guidance | 每日羅盤 — refreshes every day |

> **Why free?** Daily guidance brings users back every day. Retention > immediate revenue at this stage.

### Pro ($9.99/month)
| Feature | Description |
|---------|-------------|
| 命盤解析 | Deep LLM profile insight combining BaZi + MBTI |
| 與大師對話 | Unlimited chat with Oria AI |
| Advanced Interpretations | Future premium content |
| Pro Badge | Visual recognition in app |

> **Why these?** Profile Insight is the "wow" moment users discover on the chart page. Chat is the most engaging feature. Both are LLM-powered — they have real cost, so gating is justified.

---

## App Implementation

### Database
```sql
ALTER TABLE users ADD COLUMN plan text DEFAULT 'free';
ALTER TABLE users ADD COLUMN pro_expires_at timestamptz;
```

### Pro Check Logic
```typescript
const isPro = user.plan === 'pro' && 
  (!user.pro_expires_at || new Date(user.pro_expires_at) > new Date())
```

### Feature Gating
- Free user hits Pro feature → sees **Upgrade Page**
- Upgrade Page shows benefits + Stripe Payment Link button
- No credits, no metering, no complex logic

### Activation Flow (Manual for MVP)
```
User pays on Stripe
      ↓
Stripe sends you email notification
      ↓
You go to Supabase Dashboard
      ↓
Find user by email → set plan = 'pro'
Optionally set pro_expires_at = now + 1 month
      ↓
User refreshes app → Pro access unlocked ✓
```

### What We Build
- [ ] `plan` + `pro_expires_at` columns in DB
- [ ] `isPro` check passed to all pages via App.tsx
- [ ] Pro gate on 命盤解析 section in Chart page
- [ ] Pro gate on Chat page
- [ ] Upgrade page (beautiful, with Stripe Payment Link)
- [ ] Pro badge in TopBar for pro users

### What We Skip for MVP
- ❌ Stripe webhooks (automated activation)
- ❌ Credits system
- ❌ Billing portal / subscription management
- ❌ Usage metering
- ❌ Automated subscription renewal sync

---

## User Journey

### Free User
```
Landing → Onboarding → Chart Page
  → Sees locked 命盤解析 → "Unlock with Pro"
  → Uses Daily Guidance daily (free, keeps coming back)
  → Eventually curious enough to upgrade
```

### Pro User
```
Upgrades → Full Chart with 命盤解析
  → Chats with Oria daily
  → Gets deeper insights
```

---

## Future Phase (Post-MVP)

Once you have 20+ paying users and understand usage patterns:

1. **Stripe Webhooks** — automate pro activation
2. **Subscription Sync** — auto-expire when subscription cancels
3. **Billing Portal** — let users manage their subscription
4. **Credits System** — if data shows users want more granular control
5. **Credit Packs** — top-up for heavy users
6. **Annual Plan** — $79.99/year (2 months free)
7. **Team/Family Plan** — if demand exists

---

## Key Decisions Record

| Decision | Rationale |
|----------|-----------|
| Pro only, no free tier chat | Chat has LLM cost, must be gated |
| Daily guidance free | Drives daily retention |
| Manual activation first | Fastest to ship, fine for first 50 users |
| $9.99/month | Not too cheap (devalues), not too expensive (scary) |
| No credits MVP | Too complex, learn first what users value |
| Stripe Payment Links | Zero code, works immediately |

---

*Last updated: April 2026*
*Status: MVP Phase — Pre-launch*
