This is a substantial blueprint request. Let me produce the full Phase 0 document and render the architecture diagram visually.
V
visualize

V
visualize show_widget




Oria — Phase 0 Blueprint

## A. Product Positioning

**Landing page summary / PWA marketing copy (hero):**
Oria – When you reach a crossroads, a quiet light holds up — 
never a map, never orders. Just clarity.

**Short product description (for landing page, directory listings, 
and PWA install prompt metadata):**
Oria combines your BaZi birth chart and MBTI personality to offer 
calm, reflective guidance. Install it from your browser — no app 
store required.

**Distribution model:**
Oria is a web-first PWA. Users access it directly via URL 
(e.g. app.oria.io), are prompted to install it to their home screen 
via the browser's native PWA install prompt, and onboard entirely 
in-browser. There is no App Store or Play Store listing at this 
stage. The PWA manifest, service worker, and install UX are the 
distribution layer.

**What makes Oria different:**

From pure fortune-telling sites (e.g. Astroline): those produce 
entertaining, often deterministic predictions. Oria explicitly 
rejects this — it never says "you will" or "you must." Every output 
is framed as a pattern to notice or a question worth sitting with. 
The BaZi calculation is the starting point for reflection, not a 
verdict.

From generic AI chatbots (e.g. ChatGPT): those respond with no 
persistent identity context. Oria always grounds its responses in 
the user's specific BaZi pillars, MBTI type, and conversation 
history. It knows who you are. It speaks from that knowledge, not 
from a blank slate.


B. Information Architecture
Screens and sections
1. Onboarding Purpose: Explain Oria's philosophy, gather essential profile data (birth date/time/location for BaZi; MBTI type or questionnaire), and create the account. This screen sets expectations — users must understand Oria suggests, not prescribes. Main UI elements: philosophy statement, step-by-step form (date/time/place, MBTI entry or short questionnaire), soft progress indicator. Navigation: Completes by landing the user on Home.

**2. Daily Guidance / 每日明燈**
Purpose: The default post-login landing screen. Gives the user a fast,
practical daily overview based on their BaZi profile and today's date.
Designed to be read in under 30 seconds — a light on the day ahead,
not a deep reading. Naturally leads into the Guidance Chat for users
who want to explore further.

Main UI elements:
- Date header (today's date + lunar date equivalent)
- Today's tone badge (e.g. "Balanced", "Active", "Inward", "Reflective")
- Suggested pace (one short sentence, e.g. "A good day to finish
  things rather than start new ones")
- Helpful element card (a symbolic colour, mood, or environment
  suggestion drawn from the day's BaZi interaction with the user's
  chart)
- 2 short tips — one for work, one for relationships
- 1 gentle daily nudge sentence (the "明燈 moment")
- 2–3 suggested prompt chips that open the Guidance Chat
  pre-filled with today's context (e.g. "How should I approach a
  difficult conversation today?")
- CTA button: "Open Guidance Chat →" pre-filled with a daily question

Navigation: Default screen after login. Accessible from bottom nav
at any time. CTA and prompt chips navigate to Guidance Chat with
context pre-loaded. "My Profile" link in top corner for profile access.

3. My Profile Purpose: View and edit the main user's BaZi and MBTI data. Shows current profile version with a changelog if edits have been made. Main UI elements: BaZi pillars display (year/month/day/hour with elements), MBTI type badge, edit controls, version history indicator. Navigation: Opens Profile Summary; links to detailed BaZi and MBTI analysis modals.
4. Profile Summary Purpose: A synthesised, human-readable narrative combining BaZi tendencies with MBTI traits. This is the primary "who am I in this system" view. Main UI elements: combined summary paragraph, element balance visual, MBTI-BaZi interaction highlights, disclaimer banner, buttons for "Detailed BaZi Analysis" and "Detailed MBTI Analysis." Navigation: Accessible from Home and My Profile; detail buttons open dedicated analysis views.
5. Guidance Chat Purpose: The core experience. A conversation grounded in the user's current profile and history. The AI master responds with reflection and gentle suggestion, never directives. Main UI elements: chat thread, input bar, "session context" indicator (which profile version is active), conversation history sidebar or dropdown, credit balance indicator. Navigation: Accessible from Home and nav bar; new sessions deduct credits.
6. People & Comparisons Purpose: Add BaZi profiles of other people (partner, family, colleague). View compatibility or dynamic analysis between the main user and an additional person. Main UI elements: list of added people with their BaZi summaries, "Add person" form, comparison view (side-by-side pillar display, element interaction narrative). Navigation: Accessible from nav bar; comparison sessions cost credits (v2 for richer analysis).
7. Billing & Credits Purpose: View credit balance, transaction history, subscription status, purchase more credits. Main UI elements: current balance card, subscription tier badge, transaction ledger list, "Buy credits" button, Stripe-managed payment flow (v2). Navigation: Accessible from nav bar and Settings.
8. Settings Purpose: Account preferences, language selection, notification toggles, profile version management, danger zone (delete account). Main UI elements: language picker, notification toggles, profile version list with rollback option, account deletion. Navigation: Accessible from nav bar.
9. Help / About Purpose: Explain BaZi and MBTI concepts, Oria's methodology, disclaimers, and FAQ. Main UI elements: collapsible FAQ sections, glossary of BaZi terms, methodology note. Navigation: Accessible from Settings or footer.

C. Recommended Technical Architecture
The architecture above shows the high-level layout. Here is the rationale for each layer.
apps/web — React PWA Responsible for all user-facing rendering. Communicates exclusively with apps/api — it never calls Supabase or the analysis service directly. This simplifies security: the frontend's only trust boundary is the BFF. The PWA manifest and service worker enable offline loading of the shell and cached profile data. i18n is handled here (react-i18next or similar), with translation files in a locales/ folder. State management should be lightweight (Zustand or React Context) since most state lives server-side.
apps/api — Express BFF (Backend for Frontend) Acts as the gatekeeper for all client requests. Validates JWTs from Supabase Auth on every request. Owns the business logic layer: credit checking and deduction, profile version selection, routing requests to the analysis service, and writing results back to Supabase. It is the only service that directly writes to Supabase. It communicates with apps/analysis-service over internal HTTP (REST). For the Guidance Chat, it maintains a WebSocket connection to the frontend and streams LLM tokens as they arrive from the analysis service.
apps/analysis-service — FastAPI Python The intelligence engine. Receives structured requests from apps/api containing profile data and conversation context. It runs BaZi calculation logic (Four Pillars derivation), MBTI interpretation tables, and assembles the LLM prompt. It calls the LLM provider (Anthropic API) and streams the response back to apps/api. This service has no direct database access — all data is passed in by apps/api. This keeps the analysis service stateless and easy to test in isolation.
Communication summary:
web → api: REST for all data operations; WebSocket for streaming chat responses.
api → analysis-service: REST (HTTP POST with JSON payload).
api → Supabase: Supabase client SDK (Postgres queries + Auth admin).
analysis-service → LLM: Anthropic SDK over HTTPS.

D. Database Schema Draft
All tables live in Supabase (Postgres). Row Level Security (RLS) is enabled on every table.
users Thin identity table that mirrors Supabase Auth's auth.users. PK: id (UUID, matches auth.uid()). Key fields: email (text), display_name (text), preferred_language (text, default en), created_at (timestamptz). RLS: each row readable only by the matching authenticated user.
user_profiles The main user's mutable profile metadata. PK: id (UUID). FK: user_id → users.id (one-to-one). Key fields: current_bazi_version_id (FK to bazi_profile_versions), current_mbti_version_id (FK to mbti_profile_versions), onboarding_complete (boolean). RLS: owner only.
bazi_profile_versions Immutable append-only record of each BaZi data entry. PK: id (UUID). FK: user_id → users.id. Key fields: birth_date (date), birth_time (time, nullable), birth_location (text), year_pillar, month_pillar, day_pillar, hour_pillar (each stored as a JSON object with stem and branch), created_at (timestamptz), notes (text, optional reason for the revision). RLS: owner only. Records are never updated; a new row is inserted on every change.
mbti_profile_versions Immutable append-only. PK: id (UUID). FK: user_id → users.id. Key fields: mbti_type (text, e.g. INFJ), source (enum: manual | questionnaire), questionnaire_responses (JSONB, nullable), created_at (timestamptz). RLS: owner only.
conversations One row per conversation session. PK: id (UUID). FK: user_id → users.id. Key fields: bazi_version_id (FK, snapshot of which profile was active), mbti_version_id (FK), title (text, auto-generated from first message), status (enum: active | archived), created_at, updated_at. RLS: owner only.
messages Individual messages in a conversation. PK: id (UUID). FK: conversation_id → conversations.id. Key fields: role (enum: user | assistant), content (text), token_count (integer), created_at (timestamptz). Ordered by created_at. RLS: accessible only if the parent conversation belongs to the authenticated user (policy joins to conversations).
conversation_summaries Compacted summaries of older message windows, used to bound prompt size. PK: id (UUID). FK: conversation_id → conversations.id. Key fields: summary_text (text), covers_message_ids (UUID[], the message IDs this summary replaces), token_estimate (integer), created_at. RLS: same as messages.

**`daily_guidance`**
Caches the daily structured summary per user per calendar day.
PK: `id` (UUID). FK: `user_id` → `users.id`.
Key fields:
- `date` (date, the calendar date this guidance is for)
- `bazi_version_id` (FK → `bazi_profile_versions.id`, snapshot used)
- `summary` (JSONB, the full structured output: tone, pace,
  helpful_element, tips, nudge, suggested_prompts)
- `created_at` (timestamptz)

Unique constraint: `(user_id, date)` — one row per user per day.
RLS: owner only (`user_id = auth.uid()`).

The `summary` JSONB field stores the complete daily output so the
API can return it in a single query with no further processing.
If the user's BaZi profile changes during the day, the cached row
is still served — it reflects the profile at the time of first
generation. The new profile takes effect the following day.


persons Additional BaZi profiles (other people). PK: id (UUID). FK: user_id → users.id (who added this person). Key fields: name (text), relationship (text, e.g. "partner"), birth_date, birth_time (nullable), birth_location (text), year_pillar, month_pillar, day_pillar, hour_pillar (JSONB), created_at. RLS: owner only.
comparisons A comparison session between the main user and a person. PK: id (UUID). FK: user_id → users.id, person_id → persons.id. Key fields: bazi_version_id (main user snapshot), result_summary (text, cached output), created_at. RLS: owner only.
credits_accounts One per user. PK: id (UUID). FK: user_id → users.id (unique). Key fields: balance (integer, in credit units), updated_at. Balance is never written directly by application code — only via trigger or stored procedure that creates a corresponding transaction row first. RLS: owner only.
credits_transactions Append-only ledger. PK: id (UUID). FK: user_id → users.id, account_id → credits_accounts.id. Key fields: amount (integer, positive = credit, negative = debit), type (enum: purchase | subscription_grant | welcome_grant | chat_session | comparison | deep_reading | refund), reference_id (UUID nullable, points to the conversation or comparison that triggered the debit), balance_after (integer, denormalized for audit), created_at. RLS: owner only. This table is insert-only from the app layer.
plans (v2, scaffold now) Subscription plan definitions. PK: id (UUID). Key fields: name (text), monthly_price_usd (numeric), monthly_credit_grant (integer), stripe_price_id (text), is_active (boolean). RLS: readable by all authenticated users.
subscriptions (v2, scaffold now) PK: id (UUID). FK: user_id → users.id, plan_id → plans.id. Key fields: stripe_subscription_id (text), status (enum: active | past_due | cancelled), current_period_end (timestamptz). RLS: owner only.

E. Auth & Identity Strategy
Supabase Auth handles all identity concerns. For MVP, use magic link (email OTP) — no password, no social login friction, appropriate for a reflective personal app. Add Google OAuth in v2.
On first sign-in, a Supabase Auth trigger (Postgres after insert on auth.users) creates the corresponding row in users and credits_accounts, and grants the welcome credit balance. This ensures every authenticated user always has a credits account.
The JWT issued by Supabase Auth is attached to every request to apps/api as a Bearer token. apps/api validates the JWT using Supabase's public key — it does not call Supabase Auth on every request, just verifies the token locally. The sub claim is the user's UUID and maps directly to users.id.
RLS is the primary defense for data isolation. Every table policy follows this pattern: using (user_id = auth.uid()). For tables where the user_id is indirect (e.g. messages via conversations), the policy uses a subquery: using (conversation_id in (select id from conversations where user_id = auth.uid())). Because apps/api always uses the Supabase client with the user's JWT (not the service role key) for reads, RLS is enforced at the database level — even a bug in API routing cannot return another user's data. The service role key is used only for server-side admin operations (credit grants from webhooks) and is never exposed to the frontend.

F. AI Guidance Architecture
Request flow: The frontend sends a chat message via WebSocket to apps/api. The API validates the JWT, checks and reserves credits (marking a pending transaction), loads the relevant profile snapshot IDs from user_profiles, retrieves the active BaZi and MBTI version rows, fetches recent messages and any existing conversation summaries for this conversation, then POSTs a structured payload to apps/analysis-service.
Analysis service responsibilities: It receives a payload with: the user's BaZi pillars (structured), MBTI type, a recent message window (last N messages), any summary chunks, and the new user message. It derives BaZi interpretations (element balance, current luck pillar context, day master characteristics) using its internal Python calculation library. It interprets the MBTI type against its trait table. It assembles the prompt and calls the Anthropic API with streaming enabled, then streams tokens back to apps/api over a chunked HTTP response.
Prompt structure (high level):
System message: Establishes Oria's persona — calm, reflective, non-directive. States what the model must not do (give absolute predictions, give medical/legal/financial advice, instruct the user to take specific actions). Includes a brief description of what BaZi and MBTI frameworks represent and how to use them as lenses, not verdicts. Locks the tone vocabulary: words like "may tend to," "it's worth noticing," "you might find," "one pattern here is."
Context block (injected as a system or user prefill): The user's BaZi element summary (dominant element, weak elements, current year/luck pillar), MBTI type and its key traits, and the compact conversation summary if one exists.
Message history: The last N messages (target: ~2000 tokens of history), trimmed from the oldest if needed.
Current user message: The new question or prompt from the user.
Conversation retention strategy: Keep the most recent 20 messages in full. When a conversation reaches 30 messages, trigger a summarization job: call the LLM with the oldest 15 messages and ask for a 150-token summary focused on themes and patterns the user has explored. Store this in conversation_summaries. Delete the 15 messages that were summarized (or mark them as archived). On subsequent requests, inject the summary chunk before the remaining recent messages. This creates a rolling window that keeps prompt costs bounded while preserving the arc of the conversation. Summaries themselves are never summarized further in MVP — cap at 3 summary chunks per conversation.

**Daily Guidance generation:**

Input: the user's current BaZi profile version (pillars + element
balance) and the current calendar date (both Gregorian and lunar).

Process: the analysis service derives the day's heavenly stem and
earthly branch, calculates the interaction between the day pillar and
the user's day master and dominant element, then assembles a short
structured prompt asking the LLM to produce a fixed-schema daily
summary (tone, pace, helpful element, two tips, one nudge sentence,
three suggested prompts).

Output schema (JSON, stored as-is):
- tone: string
- pace: string
- helpful_element: { type, value, reason }
- tips: [ { area, text } ] (exactly 2)
- nudge: string
- suggested_prompts: [ string ] (2–3)

Caching: the result is stored in the daily_guidance table keyed on
(user_id, date). On each page load, the API checks for an existing
row for today before calling the LLM. If a row exists, it is returned
directly — no LLM call is made. The cache is never invalidated within
the same calendar day. This means each user incurs at most one LLM
call per day for daily guidance, keeping costs low.

Cost model: Daily Guidance generation is lightweight (small prompt,
structured output, one call per day). It is treated as a free or
included feature. The follow-up Guidance Chat, if the user chooses
to explore further, follows the normal credit deduction model.

G. Pricing & Credits Model
Initial model: New users receive 50 welcome credits on signup. A free tier allows only profile creation and profile viewing — no AI chat without credits. A basic subscription (e.g. ~$9/month) grants 200 credits per billing cycle plus access to all core features. Credits can also be purchased à la carte.
Credit costs (illustrative, to be tuned):
Starting a new guidance chat session: 5 credits
Each AI response within a session: 2 credits
Generating a combined profile summary (first time or after profile change): 10 credits
Running a person comparison: 15 credits
Deep reading or yearly outlook (v2): 30 credits
Credits ledger: The credits_accounts.balance field is the canonical balance but is never written directly by application code. Every balance change — whether a grant, purchase, or deduction — is first written as a row in credits_transactions with amount, type, reference_id, and balance_after. A Postgres trigger on credits_transactions then updates credits_accounts.balance atomically. This means the full history is always reconstructable from the transactions table alone, the balance can be audited at any point in time, and reversals are clean: a refund is simply a positive credits_transactions row with type = refund pointing to the original transaction's reference_id.
Before any AI operation begins, apps/api checks the balance, inserts a pending debit row, and proceeds. If the AI call fails, the debit is reversed with a refund row. This prevents silent credit loss on errors.

**Daily Guidance is free:**
The Daily Guidance page is part of the core included experience —
it does not cost credits. Each user gets one AI-generated daily
summary per day at no credit cost, cached and reused for all
subsequent views that day. This makes the app feel alive and
valuable every day without draining the user's balance.

The credit model activates when the user moves beyond the daily
summary into the Guidance Chat. Opening a chat session from the
Daily Guidance CTA or prompt chips follows the same credit rules
as any other chat session (5 credits to start, 2 credits per
response). This creates a natural free-to-paid transition: the
daily nudge is always free; deeper exploration costs credits.


H. UX Tone & Safeguards
Desired tone: The AI always speaks in first person but stays low-ego — it is a light, not an authority. Responses should feel like a thoughtful friend who has studied these frameworks, not a master pronouncing fate. Sentence starters like "One thing worth noticing…," "Your chart suggests a tendency toward…," or "You might find it useful to reflect on…" are preferred over "You should…" or "You will…"
The UI should mirror this: no dramatic animations, no alarm colors for BaZi challenges, no "warning" framing for difficult pillars. Challenges are "areas that may require more patience" — never "bad signs."
What Oria must never do:
State that any outcome is certain or fated.
Recommend a specific action as the right answer ("take the job," "leave the relationship").
Offer anything resembling medical, legal, or financial advice.
Moralize or judge lifestyle choices.
UI safeguards:
A persistent, unobtrusive disclaimer line sits beneath every AI response: "This is a reflection, not a prediction. You hold the decisions." This line should be styled in muted secondary text so it is always visible but never disruptive.
The onboarding screen has a required acknowledgment: "I understand Oria offers reflections and patterns, not predictions or professional advice."
The Help section includes a clear methodology explanation and links to professional resources for mental health, legal, and financial matters.
If the user's message contains crisis language (detected heuristically or by the LLM), the system responds with a gentle acknowledgment and prompts the user to speak with a qualified professional before continuing the Oria conversation.

I. MVP vs v2
MVP (buildable by one developer, ~8–12 weeks)
Email magic link auth via Supabase
Single main user with one BaZi profile and one MBTI profile (manual type entry)
BaZi calculation logic in the analysis service (Four Pillars derivation, element analysis)
Profile summary page: combined MBTI + BaZi narrative (AI-generated once, cached)
Guidance Chat: real AI responses, grounded in profile, with conversation history and summarization
Credits ledger: full transaction log, balance checking, deduction on chat actions
Pricing stub: welcome credits granted on signup; subscription tier is a boolean flag in the DB with no real payment flow (mock or manual assignment)
One additional person (BaZi only), no comparison AI — just side-by-side pillar display
- Daily Guidance page (每日明燈) — free, cached per day, 
  default post-login screen
- Multi-language from day one: English + Traditional Chinese (zh-TW).
  i18n infrastructure is already in place — translation strings for 
  both languages are populated before launch, not deferred to v2.
PWA shell (installable, basic service worker for shell caching)
Traditional Chinese language support (translation strings)
v2 and beyond
MBTI questionnaire (full or short-form, scored in the analysis service)
AI-powered comparison analysis between main user and added persons
Multiple subscription tiers with real Stripe integration
Yearly outlook and luck pillar forecasting features
Push notifications for daily nudges
Richer conversation memory (semantic search over older sessions)
Analytics dashboard for usage and credit trends (admin)
Profile version rollback UI
Social proof onboarding (testimonials, example profiles

J. Folder Structure


oria-app/
├── apps/
│   ├── web/                        # React PWA (TypeScript, Vite)
│   │   ├── src/
│   │   │   ├── pages/              # Route-level components
│   │   │   ├── components/         # Shared UI components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── store/              # State management (Zustand)
│   │   │   ├── services/           # API client functions
│   │   │   └── locales/            # i18n translation files (en/, zh-TW/)
│   │   ├── public/
│   │   └── vite.config.ts
│   │
│   ├── api/                        # Express BFF (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/             # Express routers (auth, profile, chat, credits)
│   │   │   ├── middleware/         # JWT validation, error handling, credit guard
│   │   │   ├── services/           # Business logic (credits, analysis proxy)
│   │   │   └── supabase/           # Supabase client setup
│   │   └── tsconfig.json
│   │
│   └── analysis-service/           # FastAPI Python service
│       ├── app/
│       │   ├── bazi/               # Four Pillars calculation engine
│       │   ├── mbti/               # MBTI trait interpretation tables
│       │   ├── prompts/            # Prompt assembly logic
│       │   ├── llm/                # Anthropic API client + streaming
│       │   └── main.py             # FastAPI app entry point
│       ├── tests/
│       └── requirements.txt
│
├── packages/
│   ├── shared-types/               # TypeScript interfaces shared by web and api
│   │   └── src/
│   │       ├── profile.ts
│   │       ├── chat.ts
│   │       └── credits.ts
│   │
│   └── shared-config/              # ESLint, TS base config, constants
│       ├── eslint-base.js
│       └── tsconfig.base.json
│
├── docs/
│   ├── phase-0-blueprint.md        # This document
│   ├── bazi-calculation-spec.md    # BaZi logic reference
│   └── adr/                        # Architecture Decision Records
│
├── package.json                    # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
└── turbo.json                      # Optional: Turborepo for build orchestration
Each app is independently runnable. The packages/ directories have no runtime dependencies of their own — they are compile-time only.

K. Implementation Roadmap
Phase 0 — Blueprint (current) Entry: product idea and tech direction defined. Exit: this document reviewed and approved by the team. All structural decisions locked before code is written.
Phase 1 — Repo, tooling, skeleton Goal: The monorepo exists, all three apps boot, CI runs linting and type checks. Tasks: Init pnpm workspace, configure Turborepo, scaffold apps/web with Vite + React + TypeScript, scaffold apps/api with Express + TypeScript, scaffold apps/analysis-service with FastAPI, set up packages/shared-types and shared-config, configure ESLint and Prettier across all packages, set up GitHub Actions for lint + typecheck on PR. Exit: pnpm dev starts all three services; a health check endpoint returns 200 on each; CI passes on a blank PR.
Phase 2 — Auth + user identity Goal: A real user can sign up, receive a magic link, and be logged in. Their user row and credits account are created automatically. Tasks: Configure Supabase project, enable magic link auth, create users and credits_accounts tables with RLS policies, write the after insert on auth.users trigger, implement JWT middleware in apps/api, implement login and session flow in apps/web, write the Supabase client setup for apps/api. Exit: A user can sign up, receive a magic link email, click it, and see an authenticated home screen. Their users row and credits_accounts row exist in Supabase with the welcome credit balance.
Phase 3 — MBTI + BaZi profile + summary Goal: A user can enter their birth data and MBTI type and see a combined AI-generated profile summary. Tasks: Create bazi_profile_versions, mbti_profile_versions, user_profiles tables with RLS, implement Four Pillars calculation in the analysis service (stem/branch derivation, element assignment), implement MBTI trait interpretation tables, write the profile summary prompt and call the LLM, create API endpoints for profile CRUD, build the My Profile and Profile Summary pages in the web app, cache the summary in the DB. Exit: A user can enter their birth data and MBTI type and view a combined written summary. Editing the birth data creates a new version row, not an update.
Phase 3 additional tasks (Daily Guidance — first version):
- Create `daily_guidance` table with RLS and unique constraint
  on (user_id, date)
- Add `/daily-guidance/today` endpoint to `apps/api` that:
  - checks for an existing row for today
  - if none exists, calls the analysis service to generate one
  - stores the result and returns it
- Add `/daily-guidance/generate` endpoint to
  `apps/analysis-service` that:
  - accepts BaZi profile + date
  - derives day pillar interaction
  - calls LLM with structured output prompt
  - returns the fixed-schema JSON
- Build the Daily Guidance page in `apps/web` as the default
  post-login screen
- Wire CTA and prompt chips to open Guidance Chat with
  pre-filled context
Phase 3 exit criteria update:
A logged-in user lands on the Daily Guidance page, sees today's
tone/pace/tips/nudge, and can tap a prompt chip or CTA to open
the Guidance Chat with today's context pre-loaded.

Phase 4 — Guidance Chat (minimal but real) Goal: A user can open a chat session and receive real AI responses grounded in their profile. Tasks: Create conversations, messages, conversation_summaries tables with RLS, implement WebSocket handler in apps/api, implement prompt assembly in the analysis service (profile context + message history + new message), implement streaming response forwarding from analysis service → api → web, implement the summarization trigger (at 30 messages, summarize oldest 15), build the Guidance Chat UI, add the persistent disclaimer line. Exit: A user can have a multi-turn conversation with Oria. The AI references their BaZi and MBTI. After 30 messages, older messages are summarized and the conversation continues coherently.
Phase 5 — Credits ledger + basic charging Goal: Every chargeable action checks and deducts credits. The ledger is accurate and auditable. Tasks: Implement credit guard middleware in apps/api, implement the credits_transactions table and balance-update trigger, wire credit checks to chat session start and per-response deduction, implement the Billing & Credits page in the web app (balance display + transaction history), add welcome credit grant on signup (via auth trigger), add a manual credit assignment endpoint for admin use (mocked subscription), add the credit balance indicator to the chat UI. Exit: Starting a chat and receiving responses deducts credits. The balance shown in the UI matches the DB. A user with zero credits cannot start a new session. All transactions are visible in the ledger view.
Phase 6 — Additional people & basic comparison Goal: A user can add another person's BaZi and view a side-by-side pillar comparison (no AI comparison in MVP). Tasks: Create persons table with RLS, build the People & Comparisons section (add person form, person list, side-by-side pillar display), enforce a limit of one additional person in MVP, scaffold the comparisons table for v2. Exit: A user can add one other person's BaZi details and view both sets of pillars side by side on the comparison screen. No AI response is generated yet for the comparison — that is v2.

This completes the Phase 0 Blueprint. The next step is human review of this document before any code is written. All structural decisions — schema shape, service boundaries, credit model mechanics — should be confirmed or revised here, not mid-implementation.

