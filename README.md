# Hukan SEO Auditor

Professional SaaS platform for comprehensive website SEO audits.

**Price:** KES 500 per audit (one-time payment).

Customers pay, the system crawls the website, runs deterministic technical and on-page checks, scores results, and generates a downloadable professional PDF report. Optional "Request SEO Fixes" workflow for the Hukan team.

## Status

This repository is under active phased development toward a production-ready commercial product.

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Project foundation (Next.js, Prisma, Tailwind, config) | **Done** |
| 2 | Authentication & authorization | **Done** |
| 3 | Website management & audit configuration | Pending |
| 4 | Payment integration (M-Pesa / Paystack) | Pending |
| 5 | Crawler & technical SEO engine | Pending |
| 6 | Scoring, issues, comparison | Pending |
| 7 | Dashboard & report UI | Pending |
| 8 | PDF generation | Pending |
| 9 | Search Console OAuth | Pending |
| 10 | Admin CRM & fix requests | Pending |
| 11 | Emails, observability, tests | Pending |
| 12 | Deployment & production hardening | Pending |

## Tech stack

- **Frontend / API:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth.js (credentials + optional Google)
- **Payments:** Designed for M-Pesa (Daraja) and/or Paystack
- **Crawler:** Custom (cheerio + fetch) with SSRF protection
- **Charts:** Recharts
- **Jobs:** Background worker process (tsx)

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

## Local setup

```bash
# Clone
git clone https://github.com/Levy254885/hukan-seo-auditor.git
cd hukan-seo-auditor

# Install
npm install

# Environment
cp .env.example .env
# Edit .env with DATABASE_URL and NEXTAUTH_SECRET

# Database
npx prisma generate
npx prisma db push

# Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create migration |
| `npm run worker` | Run audit background worker |
| `npm test` | Run tests |

## Environment variables

See `.env.example` for the full list. Required for basic local run:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Payment, email, Google OAuth, and storage keys are required for full production features.

## Architecture overview

```
Payment confirmed (webhook)
        ↓
   Audit Job queued
        ↓
   Crawler Worker (SSRF-safe)
        ↓
   Analysis + Scoring
        ↓
   Report + PDF
        ↓
   Dashboard + Download
```

Users can only access their own websites, audits, payments, and reports (row-level checks on every API).

Admins have a separate role and dashboard for customers, payments, fix requests, and system health.

## Security notes

- Passwords hashed with bcrypt (12 rounds)
- Webhook signature verification (planned)
- Crawler blocks private/reserved IPs and localhost (planned)
- Rate limiting on auth and audit creation (planned)
- No sequential IDs in public report URLs
- Secrets never exposed to the client
- Role-based access control (USER / ADMIN)

## License

Proprietary — All rights reserved.
