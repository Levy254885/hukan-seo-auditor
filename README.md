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
| 3 | Website management & audit configuration | **Done** |
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
git clone https://github.com/Levy254885/hukan-seo-auditor.git
cd hukan-seo-auditor
npm install
cp .env.example .env
# Edit .env with DATABASE_URL and NEXTAUTH_SECRET
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current customer path (implemented)

1. Register / sign in
2. Add a website (URL validated, private IPs blocked)
3. Configure crawl limit and depth
4. Audit created with status `PENDING_PAYMENT`
5. Payment (next phase) — crawl does **not** start yet

## License

Proprietary — All rights reserved.
