# Hunter AI - Job Management Platform

A complete job management platform for recruiters with AI-powered candidate scoring.

## Features

- **Job Management**: Create, edit, duplicate, and manage job postings
- **Candidate Tracking**: View and manage candidates with status updates
- **AI Scoring**: Automatic candidate evaluation using OpenAI
- **Resume Parsing**: Extract and analyze PDF resumes
- **Email Notifications**: Automated emails to candidates and recruiters
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## Tech Stack

### Frontend (apps/web)
- Next.js 15+ (App Router)
- React 19
- TypeScript 5
- Tailwind CSS
- TipTap (Rich Text Editor)
- Sonner (Toast Notifications)

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase)
- Supabase Auth

### Worker (apps/worker)
- Node.js
- OpenAI API
- Resend (Email)
- pdf-parse

## Project Structure

```
hunter.ai/
├── apps/
│   ├── web/                    # Next.js app (Vercel)
│   │   ├── src/
│   │   │   ├── app/           # Pages and API routes
│   │   │   ├── components/    # React components
│   │   │   ├── contexts/      # React contexts
│   │   │   └── lib/           # Utilities
│   │   └── prisma/            # Database schema
│   │
│   └── worker/                 # Background worker (Railway)
│       └── src/
│           ├── jobs/          # Processing jobs
│           └── lib/           # Utilities
│
├── packages/
│   └── core/                   # Shared code
│       └── src/
│           ├── types/         # TypeScript types
│           ├── schemas/       # Zod schemas
│           └── supabase.ts    # Supabase client
│
└── supabase/                   # Supabase setup scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account
- OpenAI API key (optional, for AI scoring)
- Resend API key (optional, for emails)

### 1. Clone and Install

```bash
git clone <repository-url>
cd hunter.ai
pnpm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)
3. Go to Settings > Database and copy the connection string
4. Run the setup script in SQL Editor:
   - Open `supabase/setup.sql`
   - Copy and paste into Supabase SQL Editor
   - Execute

### 3. Configure Environment

```bash
# Copy example env files
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env

# Edit the files with your credentials
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 5. Create Admin User

In Supabase Dashboard:
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. Click "Create user"

### 6. Run Development

```bash
# Start the web app
pnpm dev

# In another terminal, start the worker
pnpm dev:worker
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Web App)

1. Connect your GitHub repository to Vercel
2. Set Root Directory to `apps/web`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`

### Railway (Worker)

1. Create a new project in Railway
2. Connect your GitHub repository
3. Set Root Directory to `apps/worker`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `RECRUITER_EMAIL`
   - `NEXT_PUBLIC_APP_URL`

## API Endpoints

### Jobs
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job (auth required)
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id` - Update job (auth required)
- `DELETE /api/jobs/:id` - Delete job (auth required)
- `POST /api/jobs/:id/duplicate` - Duplicate job (auth required)
- `GET /api/jobs/:id/candidates` - Get job candidates (auth required)

### Candidates
- `GET /api/candidates` - List candidates (auth required)
- `POST /api/candidates` - Create candidate (public - for applications)
- `GET /api/candidates/:id` - Get candidate details (auth required)
- `PATCH /api/candidates/:id` - Update candidate (auth required)
- `DELETE /api/candidates/:id` - Delete candidate (auth required)

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user (auth required)

### Upload
- `POST /api/upload` - Upload file (resumes)

## License

MIT
