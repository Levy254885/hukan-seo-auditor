# Hukan SEO Auditor

Professional SaaS platform for comprehensive website SEO audits.

**Price:** KES 500 per audit (one-time payment).

## Status

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Project foundation | **Done** |
| 2 | Authentication & authorization | **Done** |
| 3 | Website management & audit configuration | **Done** |
| 4 | Payment integration (M-Pesa / Paystack) | **Done** |
| 5 | Crawler & technical SEO engine | **Done** |
| 6 | Scoring, issues, comparison | Partial (scoring v1.0 in Phase 5) |
| 7 | Dashboard & report UI | Partial |
| 8 | PDF generation | Pending |
| 9 | Search Console OAuth | Pending |
| 10 | Admin CRM & fix requests | Pending |
| 11 | Emails, observability, tests | Pending |
| 12 | Deployment & production hardening | Pending |

## Crawler

- Real HTTP fetch with timeout and 2MB response limit
- SSRF protection before and after redirects
- HTML parse: title, meta, H1, links, images, JSON-LD, Open Graph
- Deterministic issue rules (no random scores)
- Scoring version `1.0` stored on each audit
- Background worker: `npm run worker`
- Admin/cron process: `POST /api/audits/process` with `Authorization: Bearer $CRON_SECRET`

## Payments

- Amount: **KES 500** server-side only
- M-Pesa STK + Paystack webhooks
- Audit queued only after confirmed payment

## Local setup

```bash
git clone https://github.com/Levy254885/hukan-seo-auditor.git
cd hukan-seo-auditor
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev
# In another terminal:
npm run worker
```

Repo: https://github.com/Levy254885/hukan-seo-auditor
