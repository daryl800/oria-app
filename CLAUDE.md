# CLAUDE.md

## Project
Oria

## Brand
Oria – Nudge your choices, never dictate your fate.
When you need a light on your path, I’m here.

Oria —— 無論你走到哪個路口，明燈都在照著你。讓你看清前路。

## Product Philosophy
Oria is a gentle personal guidance app.
It does not tell users how to live.
It offers contextual, reflective, profile-aware suggestions based on BaZi, MBTI, and user history.

## Core Features
- Main user profile
- MBTI profile
- BaZi profile
- Summary view
- Guidance chat
- Additional people for BaZi comparison
- Credits / subscription system
- Multilingual support
- PWA support

## Technical Direction
- Frontend: React + TypeScript
- Backend: Express + TypeScript
- Analysis microservice: FastAPI + Python
- Database/Auth: Supabase

## Build Rules
- Build in phases, not one-shot full-stack generation
- Propose before major architecture changes
- Keep files and modules understandable
- Prefer simple and reviewable solutions
- Separate MVP from future features
- Do not introduce unnecessary complexity
- Before editing schema, auth, payments, or deletion logic, explain the plan first
