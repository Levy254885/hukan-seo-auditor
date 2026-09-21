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
| 6 | Scoring, issues, comparison | **Done** |
| 7 | Dashboard & report UI | **Done** |
| 8 | PDF generation | **Done** (v1 text PDF) |
| 9 | Search Console OAuth | Pending |
| 10 | Admin CRM & fix requests | Pending |
| 11 | Emails, observability, tests | Pending |
| 12 | Deployment & production hardening | Pending |

## Product path

1. Register / sign in
2. Add website (SSRF-safe URL check)
3. Configure crawl limits → audit `PENDING_PAYMENT`
4. Pay KES 500 (M-Pesa STK or Paystack webhook)
5. Worker crawls, scores, stores issues
6. View report, compare snapshots, download PDF

## Key commands

```bash
npm run dev
npm run worker
npx prisma db push
```

PDF: `GET /api/audits/{publicId}/pdf` (completed audits only)

Repo: https://github.com/Levy254885/hukan-seo-auditor
