# Rankea.ai (smart-picker) — Project Memory

> Carregado junto com o CLAUDE.md global. Contém apenas info específica deste projeto.

---

## Overview

Plataforma de job management com scoring de candidatos via IA. Nome do produto: **Rankea.ai**. Nome técnico do monorepo (legado): **smart-picker** / **hunter-ai**.

- **Repo:** https://github.com/VanderCaneppelle/smart-picker (branch principal: `main`)
- **Dev principal:** Vander Caneppelle (noivo da Tai)
- **Role da Tai:** revisão, ajustes pontuais, manter local atualizado com `git pull`.

## Stack

**Frontend (apps/web):** Next.js 15 (App Router), React 19, TS 5, Tailwind, TipTap, Sonner
**Backend:** Next.js API Routes, Prisma ORM, PostgreSQL via Supabase, Supabase Auth
**Worker (apps/worker):** Node.js, OpenAI API, Resend (email), pdf-parse
**Shared (packages/core):** types, Zod schemas, Supabase client
**Package manager:** pnpm 8+ (workspace). Node >= 20.

## Estrutura

```
smart-picker/
├── apps/
│   ├── web/      ← Next.js app (deploy: Vercel)
│   └── worker/   ← background jobs (deploy: Railway)
├── packages/
│   └── core/     ← types, schemas, Supabase client compartilhado
└── supabase/     ← scripts de setup
```

## Comandos

```bash
pnpm install                # setup
pnpm dev                    # web dev server
pnpm dev:worker             # worker em outro terminal
pnpm db:generate            # Prisma client
pnpm db:push                # sync schema pro Supabase
pnpm db:migrate             # nova migration
pnpm db:studio              # Prisma Studio
pnpm lint                   # lint em todos workspaces
```

## Deploys

- **Vercel** → `apps/web` (vars: `NEXT_PUBLIC_SUPABASE_*`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`)
- **Railway** → `apps/worker` (vars: `SUPABASE_*`, `DATABASE_URL`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `RECRUITER_EMAIL`)

## Workflow para Tai

1. **Sempre começar com `git pull`** — Vander codifica mais, evitar conflitos.
2. Antes de fazer mudança: confirmar branch (`git status`).
3. **Não commitar `.env` nem variáveis de ambiente.** Usar `.env.example` como referência.
4. Para mudanças, criar branch `feature/<descricao-curta>` a partir de `main`.
5. Commit messages em inglês, curtos, descritivos.
6. Nunca rodar `db:push` ou `db:migrate` sem alinhar com Vander — afeta DB compartilhado.

## Regras

- **Nunca force-push em `main`.** Sempre PR.
- **Endpoints públicos vs autenticados:** cuidar dos middlewares — `POST /api/candidates` é público (aplicações), resto requer auth.
- **Supabase service_role_key nunca vai pro frontend.** Só worker/API routes do backend.
