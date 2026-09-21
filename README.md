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
| 8 | PDF generation | **Done** |
| 9 | Search Console OAuth | Pending |
| 10 | Admin CRM & fix requests | **Done** |
| 11 | Emails, observability, tests | Pending |
| 12 | Deployment & production hardening | Pending |

## Admin

Set `ADMIN_EMAIL` to the account that should receive `ADMIN` role on register/login.

- `/admin` — overview KPIs
- `/admin/customers` — users
- `/admin/payments` — payment ledger
- `/admin/fix-requests` — CRM pipeline (status, quote, notes)

## Fix requests

Customers submit from a completed audit report. Pipeline statuses: NEW → CONTACTED → QUOTED → APPROVED → IN_PROGRESS → COMPLETED / RE_AUDIT / CLOSED.

## Local setup

```bash
git clone https://github.com/Levy254885/hukan-seo-auditor.git
cd hukan-seo-auditor
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev
npm run worker
```

Repo: https://github.com/Levy254885/hukan-seo-auditor
