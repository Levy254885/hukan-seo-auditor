# Hukan SEO Auditor

Professional SaaS for website SEO audits. **KES 500** per audit (one-time payment).

**Repository:** https://github.com/Levy254885/hukan-seo-auditor

## Status

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Project foundation | **Done** |
| 2 | Authentication & authorization | **Done** |
| 3 | Website management & audit configuration | **Done** |
| 4 | Payment integration (M-Pesa / Paystack) | **Done** |
| 5 | Crawler & technical SEO engine | **Done** |
| 6 | Scoring, issues, comparison | **Done** |
| 7 | Dashboard & report UI | **Done** |
| 8 | PDF generation | **Done** |
| 9 | Search Console OAuth | Pending (stubs / env ready) |
| 10 | Admin CRM & fix requests | **Done** |
| 11 | Emails, observability, tests | **Done** |
| 12 | Deployment config | **Done** (see DEPLOY.md) |

## Product path

1. Register / sign in
2. Add website (SSRF-safe)
3. Configure audit → `PENDING_PAYMENT`
4. Pay KES 500 (webhook confirms)
5. Worker crawls → scores → issues
6. Report, compare, PDF, request fixes

## Commands

```bash
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev
npm run worker
npm test
```

Health: `GET /api/health`

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Vercel, Docker, env checklist, and worker notes.
