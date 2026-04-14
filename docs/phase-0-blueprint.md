# Oria — Phase 0 Blueprint

---

## A. Product Positioning

**Landing page summary / PWA marketing copy (hero):**
Oria – When you reach a crossroads, a quiet light holds up — never a map, never orders. Just clarity.

**Short product description (for landing page, directory listings, and PWA install prompt metadata):**
Oria combines your BaZi birth chart and MBTI personality to offer calm, reflective guidance. Install it from your browser — no app store required.

**Distribution model:**
Oria is a web-first PWA. Users access it directly via URL (e.g. app.oria.io), are prompted to install it to their home screen via the browser's native PWA install prompt, and onboard entirely in-browser. There is no App Store or Play Store listing at this stage. The PWA manifest, service worker, and install UX are the distribution layer.

**What makes Oria different:**

From pure fortune-telling sites (e.g. Astroline): those produce entertaining, often deterministic predictions. Oria explicitly rejects this — it never says "you will" or "you must." Every output is framed as a pattern to notice or a question worth sitting with. The BaZi calculation is the starting point for reflection, not a verdict.

From generic AI chatbots (e.g. ChatGPT): those respond with no persistent identity context. Oria always grounds its responses in the user's specific BaZi pillars, MBTI type, and conversation history. It knows who you are. It speaks from that knowledge, not from a blank slate.

---

## B. Information Architecture

### Screens and sections

**1. Onboarding**
Purpose: Explain Oria's philosophy, gather essential profile data (birth date/time/location for BaZi; MBTI type or questionnaire), and create the account. This screen sets expectations — users must understand Oria suggests, not prescribes.
Main UI elements: philosophy statement, step-by-step form (date/time/place, MBTI entry or short questionnaire), soft progress indicator, required acknowledgment checkbox.
Navigation: Completes by landing the user on Daily Guidance.

**2. Daily Guidance / 每日明燈**
Purpose: The default post-login landing screen. Gives the user a fast, practical daily overview based on their BaZi profile and today's date. Designed to be read in under 30 seconds — a light on the day ahead, not a deep reading. Naturally leads into the Guidance Chat for users who want to explore further.
Main UI elements:
- Date header (today's date + lunar date equivalent)
- Today's tone badge (e.g. "Balanced", "Active", "Inward", "Reflective")
- Suggested pace (one short sentence)
- Helpful element card (colour, mood, or environment suggestion)
- 2 short tips — one for work, one for relationships
- 1 gentle daily nudge sentence (the "明燈 moment")
- 2–3 suggested prompt chips that open the Guidance Chat pre-filled with today's context
- CTA button: "Open Guidance Chat →" pre-filled with a daily question

Navigation: Default screen after login. Accessible from bottom nav at any time. CTA and prompt chips navigate to Guidance Chat with context pre-loaded.

**3. My Profile**
Purpose: View and edit the main user's BaZi and MBTI data. Shows current profile version with a changelog if edits have been made.
Main UI elements: BaZi pillars display (year/month/day/hour with elements), MBTI type badge, edit controls, version history indicator.
Navigation: Opens Profile Summary; links to detailed BaZi and MBTI analysis views.

**4. Profile Summary**
Purpose: A synthesised, human-readable narrative combining BaZi tendencies with MBTI traits. The primary "who am I in this system" view.
Main UI elements: combined summary paragraph, element balance visual, MBTI-BaZi interaction highlights, disclaimer banner, buttons for detailed analysis.
Navigation: Accessible from Daily Guidance and My Profile.

**5. Guidance Chat**
Purpose: The core experience. A conversation grounded in the user's current profile and history. The AI master responds with reflection and gentle suggestion, never directives.
Main UI elements: chat thread, input bar, session context indicator, conversation history, upgrade prompt (for free users who have exhausted free exchanges).
Navigation: Accessible from Daily Guidance CTA, prompt chips, and bottom nav.

**6. People & Comparisons** (Pro feature)
Purpose: Add BaZi profiles of other people (partner, family, colleague). View side-by-side pillar display.
Main UI elements: list of added people, "Add person" form, side-by-side pillar comparison view.
Navigation: Accessible from bottom nav; gated behind Pro tier for free users.

**7. Billing & Subscription**
Purpose: View subscription status, manage plan, and access Stripe Customer Portal.
Main UI elements: current plan badge, "Upgrade to Pro" CTA (free users), "Manage subscription" link (Pro users, opens Stripe Portal).
Navigation: Accessible from bottom nav and Settings.

**8. Settings**
Purpose: Account preferences, language selection, notification toggles, danger zone.
Main UI elements: language picker (EN / 繁體中文), notification toggles, display name edit, account deletion.
Navigation: Accessible from bottom nav.

**9. Help / About**
Purpose: Explain BaZi and MBTI concepts, Oria's methodology, disclaimers, and FAQ.
Main UI elements: collapsible FAQ sections, glossary of BaZi terms, methodology note, professional resource links.
Navigation: Accessible from Settings or footer.

---

## C. Recommended Technical Architecture

### Overview

```
Browser (PWA)
  → apps/web (React + Vite)
      → apps/api (Node.js + Express)  ← only LLM + DB contact point
          → Qianwen / OpenAI-compatible LLM (direct from Node.js)
          → apps/analysis-service (Python + FastAPI)  ← BaZi math only
          → Supabase (Postgres + Auth + RLS)
```

### apps/web — React PWA
Responsible for all user-facing rendering. Communicates exclusively with apps/api — never calls Supabase or the analysis service directly. The PWA manifest and service worker enable offline loading of the shell. i18n is handled here with react-i18next, with translation files in a locales/ folder.

### apps/api — Express BFF (Backend for Frontend)
The gatekeeper for all client requests. Validates JWTs from Supabase Auth on every request. Owns all business logic: access control (free vs Pro), LLM calls (directly via OpenAI-compatible SDK), routing BaZi calculation requests to the analysis service, and writing results back to Supabase. This is the only service that writes to Supabase.

### apps/analysis-service — FastAPI Python
A pure calculation engine. Receives structured requests from apps/api and returns BaZi pillars and MBTI interpretation data. Has no direct database access and makes no LLM calls. Stateless and independently testable.

### Communication summary
- `web → api`: REST for all data; no direct WebSocket in MVP (polling or simple HTTP streaming)
- `api → analysis-service`: REST (HTTP POST with JSON)
- `api → LLM`: OpenAI-compatible SDK (Qianwen / dashscope) over HTTPS
- `api → Supabase`: Supabase client SDK

---

## D. Database Schema Draft

All tables in Supabase (Postgres). RLS enabled on every table.

### `users`
Mirrors Supabase Auth's auth.users.
- PK: `id` (UUID, matches auth.uid())
- `email` (text)
- `display_name` (text, nullable)
- `preferred_language` (text, default `en`)
- `stripe_customer_id` (text, nullable) — set on first Stripe checkout
- `subscription_status` (text, default `free`) — `free | active | past_due | cancelled`
- `plan_id` (text, nullable) — e.g. `pro_monthly`, `pro_annual`
- `current_period_end` (timestamptz, nullable) — gates Pro feature access
- `free_chat_exchanges_used` (integer, default 0) — lifetime free chat counter
- `created_at` (timestamptz)

RLS: owner only.

### `user_profiles`
Mutable profile metadata for the main user.
- PK: `id` (UUID)
- `user_id` (FK → users.id, unique)
- `current_bazi_version_id` (FK → bazi_profile_versions.id, nullable)
- `current_mbti_version_id` (FK → mbti_profile_versions.id, nullable)
- `onboarding_complete` (boolean, default false)
- `created_at`, `updated_at` (timestamptz)

RLS: owner only.

### `bazi_profile_versions`
Immutable, append-only. New row on every edit — never updated.
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `birth_date` (date)
- `birth_time` (time, nullable)
- `birth_location` (text)
- `year_pillar`, `month_pillar`, `day_pillar`, `hour_pillar` (JSONB, stem + branch + elements)
- `day_master` (text)
- `five_elements_strength` (JSONB)
- `notes` (text, nullable)
- `created_at` (timestamptz)

RLS: owner only.

### `mbti_profile_versions`
Immutable, append-only.
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `mbti_type` (text, e.g. `INFJ`)
- `source` (text: `manual | questionnaire`)
- `questionnaire_responses` (JSONB, nullable) — stores raw answers when source is `questionnaire`
- `created_at` (timestamptz)

RLS: owner only.

### `conversations`
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `bazi_version_id` (FK → bazi_profile_versions.id)
- `mbti_version_id` (FK → mbti_profile_versions.id)
- `title` (text, auto-generated from first message)
- `status` (text: `active | archived`)
- `created_at`, `updated_at` (timestamptz)

RLS: owner only.

### `messages`
- PK: `id` (UUID)
- `conversation_id` (FK → conversations.id)
- `role` (text: `user | assistant`)
- `content` (text)
- `token_count` (integer)
- `created_at` (timestamptz)

RLS: accessible only if parent conversation belongs to auth.uid().

### `conversation_summaries`
- PK: `id` (UUID)
- `conversation_id` (FK → conversations.id)
- `summary_text` (text)
- `covers_message_ids` (UUID[])
- `token_estimate` (integer)
- `created_at` (timestamptz)

RLS: same as messages.

### `daily_guidance`
Caches daily structured summary per user per calendar day.
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `bazi_version_id` (FK → bazi_profile_versions.id)
- `date` (date)
- `summary` (JSONB: tone, pace, helpful_element, tips, nudge, suggested_prompts)
- `created_at` (timestamptz)

Unique constraint: `(user_id, date)`. RLS: owner only.

### `persons`
Additional BaZi profiles (other people).
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `name` (text)
- `relationship` (text)
- `birth_date` (date), `birth_time` (time, nullable), `birth_location` (text)
- `year_pillar`, `month_pillar`, `day_pillar`, `hour_pillar` (JSONB)
- `created_at` (timestamptz)

RLS: owner only.

### `comparisons` (scaffold for v2)
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `person_id` (FK → persons.id)
- `bazi_version_id` (FK → bazi_profile_versions.id)
- `result_summary` (text, nullable)
- `created_at` (timestamptz)

RLS: owner only.

### `credits_accounts` (scaffolded, not active in MVP)
- PK: `id` (UUID)
- `user_id` (FK → users.id, unique)
- `balance` (integer, default 0)
- `updated_at` (timestamptz)

### `credits_transactions` (scaffolded, not active in MVP)
Append-only ledger.
- PK: `id` (UUID)
- `user_id` (FK → users.id)
- `account_id` (FK → credits_accounts.id)
- `amount` (integer, positive = credit, negative = debit)
- `type` (enum: `welcome_grant | purchase | subscription_grant | chat_session | comparison | deep_reading | refund`)
- `reference_id` (UUID, nullable)
- `balance_after` (integer, denormalized for audit)
- `created_at` (timestamptz)

Note: `plans` and `subscriptions` tables are deferred to v2 when multiple tiers exist. In MVP, subscription state lives directly on the `users` table.

---

## E. Auth & Identity Strategy

Supabase Auth handles all identity concerns. For MVP, use magic link (email OTP) — no password, no social login friction. Add Google OAuth in v2.

On first sign-in, a Postgres trigger (`after insert on auth.users`) creates the corresponding row in `users`, `user_profiles`, and `credits_accounts` automatically.

The JWT issued by Supabase Auth is attached to every request to apps/api as a Bearer token. apps/api validates the JWT on each request. The `sub` claim maps directly to `users.id`.

RLS is the primary data isolation layer. Every table policy follows `using (user_id = auth.uid())`. For indirect ownership (e.g. messages via conversations), policies use a subquery. The service role key is used only for webhook handlers and admin operations — never exposed to the frontend.

---

## F. AI Guidance Architecture

### Chat request flow

```
User sends message
  → apps/api validates JWT + checks access tier
  → loads BaZi + MBTI profile versions from Supabase
  → loads recent messages + conversation summary
  → builds prompt (date, user name, profile, history, message)
  → calls LLM directly via OpenAI-compatible SDK
  → saves user + assistant messages to Supabase
  → returns response to browser
```

### Prompt structure

**System message:** Establishes Oria's persona — calm, reflective, non-directive. Injects today's date, user's name, BaZi day master + element strengths, MBTI type + traits. States absolute safety rules (no crisis content, no absolute predictions, no medical/legal/financial advice). Locks tone vocabulary.

**Context block (if prior conversation exists):** Compact conversation summary injected before recent messages.

**Message history:** Last 20 messages in full.

**Current user message:** The new input.

### Conversation retention strategy

Keep the most recent 20 messages in full. When a conversation reaches 30 messages, trigger summarization: call the LLM with the oldest 15 messages and request a ~150-token summary of themes explored. Store in `conversation_summaries`. Mark the 15 messages as archived. Cap at 3 summary chunks per conversation in MVP.

### Daily Guidance generation

Input: user's BaZi profile + current calendar date.
Process: apps/api calls analysis service to get today's day stem and branch, then calls LLM directly with a structured prompt requesting fixed-schema JSON output.
Output schema: `{ tone, pace, helpful_element: { type, value, reason }, tips: [{ area, text }], nudge, suggested_prompts: [] }`
Caching: stored in `daily_guidance` table keyed on `(user_id, date)`. Cache checked before every LLM call — at most one call per user per day.

### Safety layers

Two-layer crisis detection:
1. **Local keyword filter** in apps/api — catches obvious crisis language instantly, before LLM is called
2. **LLM safety clause** in system prompt — catches subtle crisis signals the keyword filter misses

If either layer triggers, the LLM response is replaced with a crisis support message and helpline numbers. The `crisis_detected` flag is returned to the frontend for logging.

---

## G. Pricing, Credits & Monetization

### MVP monetization model

**Free tier:**
- Account creation and onboarding
- BaZi + MBTI profile setup
- Profile summary (one AI generation, cached)
- Daily Guidance — one free read per day, always free
- Guidance Chat — 3 free exchanges lifetime (enough to experience the core value)

**Pro tier (~$9 USD/month or ~$79 USD/year):**
- Unlimited Guidance Chat
- Daily Guidance in both languages
- People & Comparisons (basic pillar display)

### What is free vs paid

| Feature | Free | Pro |
|---|---|---|
| Onboarding + profile setup | ✅ | ✅ |
| BaZi + MBTI profile | ✅ | ✅ |
| Profile summary | ✅ (once) | ✅ |
| Daily Guidance | ✅ (1/day) | ✅ |
| Guidance Chat | 3 exchanges lifetime | Unlimited |
| People & Comparisons | ❌ | ✅ |
| EN + zh-TW language | ✅ | ✅ |

### Paywall placement

Paywalls in Oria must feel calm and non-aggressive — an invitation, not a gate. Upgrade prompts appear in two places only:

1. **Chat input** — when a free user has used their 3 free exchanges, the input bar is replaced with a soft upgrade card: "You've experienced Oria's guidance. Continue the conversation with a Pro membership."
2. **People & Comparisons** — when a free user taps "Add person", a gentle modal explains this is a Pro feature with a single "Upgrade" CTA.

No countdown timers, no urgency language, no dark patterns. The upgrade experience must match Oria's calm tone.

### Stripe as payment provider

Stripe handles all payment processing. In MVP:
- **Stripe Checkout** (hosted page) for subscription purchase — no custom payment form
- **Stripe Customer Portal** for subscription management (cancel, update card) — no custom UI
- **Stripe webhooks** to sync subscription status to Supabase

Webhook events to handle:
- `customer.subscription.created` → set `subscription_status = active`
- `customer.subscription.updated` → sync status + `current_period_end`
- `customer.subscription.deleted` → set `subscription_status = cancelled`
- `invoice.payment_failed` → set `subscription_status = past_due`

### Upgrade flow

```
User hits free limit
  → API returns 402 { upgrade_required: true }
  → Frontend shows calm upgrade card
  → User clicks "Upgrade"
  → POST /api/billing/create-checkout-session
  → API creates Stripe Checkout session
  → Frontend redirects to Stripe hosted page
  → Payment complete → Stripe webhook fires
  → subscription_status updated to 'active' in Supabase
  → User redirected back to app with Pro access
```

### Credits ledger (scaffolded, not active in MVP)

The credits tables are created in Phase 2 and remain in the schema but are not wired to any user-facing feature in MVP. In v2, credits become the mechanism for à la carte purchases (deep readings, comparisons, special sessions). The ledger is append-only from day one so the audit trail is clean when credits go live.

---

## H. UX Tone & Safeguards

**Desired tone:** The AI always speaks in first person but stays low-ego — it is a light, not an authority. Responses feel like a thoughtful friend who has studied these frameworks, not a master pronouncing fate. Preferred starters: "One thing worth noticing…", "Your chart suggests a tendency toward…", "You might find it useful to reflect on…". Never: "You should…" or "You will…"

**What Oria must never do:**
- State that any outcome is certain or fated
- Recommend a specific action as the right answer
- Offer anything resembling medical, legal, or financial advice
- Moralize or judge lifestyle choices
- Mention, suggest, or imply death, suicide, self-harm, or harming others in any form

**UI safeguards:**
- A persistent, unobtrusive disclaimer beneath every AI response: "This is a reflection, not a prediction. You hold the decisions."
- Required acknowledgment on onboarding: "I understand Oria offers reflections and patterns, not predictions or professional advice."
- Help section includes a methodology explanation and links to professional resources
- Crisis language triggers an immediate support response with helpline numbers — the AI reading is never continued

---

## H2. Payments & Access Control

### Access control logic

Every protected API endpoint checks in this order:
1. Is the user authenticated? (JWT) — if not, 401
2. Is the feature free for all? (Daily Guidance, profile) — allow
3. Is the user Pro? (`subscription_status = active` AND `current_period_end > now()`) — allow
4. Is the user within free tier limits? (`free_chat_exchanges_used < 3`) — allow and increment
5. Otherwise — return 402 with `{ upgrade_required: true }`

This logic lives in apps/api middleware. The frontend never makes access decisions.

### Stripe webhook endpoint

`POST /api/webhooks/stripe` — public endpoint (no JWT), verified by Stripe webhook signing secret. Updates `users` table fields based on subscription events.

### Stripe Customer Portal (self-serve)

```
User goes to Settings → Manage subscription
  → POST /api/billing/create-portal-session
  → API creates Stripe Customer Portal session
  → Frontend redirects to Stripe hosted portal
  → User can cancel, update card, view invoices
  → Returns to app when done
```

---

## I. MVP vs v2

### MVP (buildable by one developer, ~8–12 weeks)

- Email magic link auth via Supabase
- Single main user with BaZi + MBTI profile (manual entry)
- BaZi Four Pillars calculation in Python (sxtwl library, true solar time, 3 or 4 pillars)
- MBTI interpretation tables in Python
- Profile summary (AI-generated, cached)
- Daily Guidance page (每日明燈) — free, cached per day, default post-login screen
- Guidance Chat — real AI responses grounded in profile + date + user name, with conversation history and summarization
- Two-layer safety (crisis keyword filter + LLM safety clause)
- Free tier enforcement (3 lifetime chat exchanges)
- Stripe Checkout + webhook for Pro subscription
- Stripe Customer Portal for self-serve management
- Credits tables scaffolded but not user-facing
- One additional person (BaZi only, side-by-side pillar display, Pro-gated)
- English + Traditional Chinese (zh-TW) from day one
- PWA (installable, service worker for shell caching, manifest for home-screen install)
- MBTI questionnaire (20-question short form, scored in Python 
  analysis service, result shown with dimension breakdown)
- Manual MBTI type entry still available for users who know their type

### v2 and beyond

- AI-powered comparison analysis
- Credits ledger active (à la carte purchases)
- Multiple subscription tiers
- Annual vs monthly toggle on upgrade page
- Yearly outlook and luck pillar forecasting
- Push notifications for daily nudges
- Richer conversation memory (semantic search over older sessions)
- Analytics dashboard (admin)
- Profile version rollback UI
- Simplified Chinese (zh-CN) language support
- Google OAuth
- Social proof onboarding (testimonials, example profiles)

---

## J. Folder Structure

```
oria-app/
├── apps/
│   ├── web/                        # React PWA (TypeScript, Vite)
│   │   ├── src/
│   │   │   ├── pages/              # Route-level components
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── DailyGuidance.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── Chat.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── components/         # Shared UI components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── services/           # API client functions (api.ts)
│   │   │   ├── lib/                # supabase.ts, i18n.ts
│   │   │   └── locales/            # en/common.json, zh-TW/common.json
│   │   ├── public/
│   │   └── vite.config.ts
│   │
│   ├── api/                        # Express BFF (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/             # dailyGuidance.ts, profile.ts, chat.ts, billing.ts
│   │   │   ├── middleware/         # auth.ts, accessControl.ts
│   │   │   ├── lib/                # supabase.ts, llm.ts, prompts.ts, safety.ts
│   │   │   └── common/             # Paths.ts, env.ts
│   │   └── config/
│   │       └── .env.development    # SUPABASE_URL, QIANWEN_API_KEY, STRIPE_SECRET_KEY
│   │
│   └── analysis-service/           # FastAPI Python — calculation engine only
│       ├── app/
│       │   ├── bazi.py             # Four Pillars calculation (sxtwl)
│       │   ├── mbti.py             # MBTI interpretation tables
│       │   └── main.py             # FastAPI endpoints (/bazi/calculate, /mbti/profile)
│       ├── requirements.txt
│       └── .venv/
│
├── packages/
│   ├── shared-types/               # TypeScript interfaces (profile.ts, chat.ts, credits.ts)
│   └── shared-config/              # tsconfig.base.json, eslint-base.js
│
├── docs/
│   ├── phase-0-blueprint.md        # This document
│   └── adr/                        # Architecture Decision Records
│
├── package.json                    # Monorepo root
└── pnpm-workspace.yaml
```

---

## K. Implementation Roadmap

**Phase 0 — Blueprint** ✅
Exit: Blueprint reviewed, all structural decisions locked.

---

**Phase 1 — Repo, tooling, skeleton** ✅
Goal: Monorepo exists, all three apps boot, health checks pass.
Exit: `apps/web` on :5173, `apps/api` on :3000, `apps/analysis-service` on :5002 — all returning 200 on health check.

---

**Phase 2 — Auth + user identity** ✅
Goal: Real user can sign up via magic link. User row, user_profiles row, and credits_accounts row created automatically on signup.
Exit: User signs up, receives magic link, logs in, sees authenticated screen. All DB rows exist with correct data.

---

**Phase 3 — BaZi + MBTI profile + Daily Guidance + Profile Summary** ✅ (in progress)
Goal: User can enter birth data + MBTI type, see a combined AI-generated profile summary, and view a daily guidance page.
Tasks completed:
- BaZi Four Pillars calculation engine (Python, sxtwl, true solar time, 3/4 pillars)
- MBTI interpretation tables (Python)
- Profile save endpoints (BaZi + MBTI, append-only versioning)
- Profile summary (LLM via Node.js)
- Daily Guidance endpoint + caching
- Daily Guidance page (default post-login screen)
- Profile page (form + summary view)
- i18n (EN + zh-TW)
- LLM refactored to Node.js; Python is pure calculation engine
- Routing (React Router)
- CORS configured
- MBTI questionnaire endpoint (20 questions, A/B scoring per dimension)
- Questionnaire UI with progress indicator, dot navigation, result screen
- questionnaire_responses column on mbti_profile_versions

Exit: User enters birth data + MBTI, views profile summary, lands on Daily Guidance page with today's tone/tips/nudge.

---

**Phase 4 — Guidance Chat** ✅ (in progress)
Goal: User can have a real multi-turn conversation with Oria, grounded in profile + date + user name.
Tasks completed:
- Conversations + messages + conversation_summaries tables
- Chat endpoint (apps/api/src/routes/chat.ts)
- Profile context + date + user name injected into every prompt
- Two-layer crisis detection (keyword filter + LLM safety clause)
- Chat UI (Chat.tsx) with message history, prefill from Daily Guidance

Remaining:
- Conversation summarization trigger (at 30 messages, summarize oldest 15)
- Conversation history list (load previous conversations)
- Bottom navigation bar

Exit: User can have a multi-turn conversation. AI references their BaZi, MBTI, name, and today's date. Crisis messages trigger safety response. Previous conversation context is loaded correctly.

---

**Phase 5 — Navigation + UI polish**
Goal: The app feels like a real product, not raw HTML. Bottom nav, consistent layout, i18n strings complete in both languages.
Tasks:
- Bottom navigation bar (Daily / Chat / Profile / Settings)
- Consistent page layout component
- Populate all zh-TW translation strings
- PWA manifest icons + splash screen
- Basic loading and error states

Exit: Navigating between all pages works naturally. Both EN and zh-TW are fully translated. App is installable as PWA.

---

**Phase 5b — Stripe integration + access control**
Goal: Real payment flow. Free tier limits enforced. Users can upgrade to Pro.
Tasks:
- Add billing fields to `users` table (stripe_customer_id, subscription_status, plan_id, current_period_end, free_chat_exchanges_used)
- Install Stripe SDK in apps/api
- Access control middleware (free tier check + Pro check)
- `POST /api/billing/create-checkout-session`
- `POST /api/billing/create-portal-session`
- `POST /api/webhooks/stripe` with signature verification
- Upgrade prompt UI (calm card, not aggressive modal)
- Settings → Manage Subscription flow
- Test full payment flow in Stripe test mode

Entry criteria: Core guidance flow stable and tested (Phases 1–4 complete).
Exit: Free user who hits chat limit sees upgrade prompt, completes Stripe Checkout, gains Pro access. Cancellation via Customer Portal correctly reverts access.

---

**Phase 6 — Credits ledger (scaffold → active)**
Goal: Credits tables become user-facing. Balance visible. Deductions happen on chargeable actions.
Tasks:
- Wire credit guard middleware to chat actions
- Billing page (balance display + transaction history)
- Welcome credit grant on signup (via auth trigger)
- Manual credit assignment endpoint (admin use)

Exit: Starting a chat deducts credits. Balance shown in UI matches DB. All transactions visible in ledger. User with zero credits cannot start a new session.

---

**Phase 7 — Additional people & comparison**
Goal: Pro user can add another person's BaZi and view side-by-side pillar comparison.
Tasks:
- persons table + RLS
- People & Comparisons page (add person form, person list, side-by-side display)
- Pro gate on add person
- Scaffold comparisons table for v2 AI comparison

Exit: Pro user can add one other person's BaZi and view both sets of pillars side by side. Free users see upgrade prompt.

---

*This completes the Phase 0 Blueprint (current as of Phase 4 in-progress). All structural decisions — schema shape, service boundaries, payment model, safety architecture — are captured here. Implementation continues phase by phase.*
