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
| 5 | Crawler & technical SEO engine | Pending |
| 6 | Scoring, issues, comparison | Pending |
| 7 | Dashboard & report UI | Pending |
| 8 | PDF generation | Pending |
| 9 | Search Console OAuth | Pending |
| 10 | Admin CRM & fix requests | Pending |
| 11 | Emails, observability, tests | Pending |
| 12 | Deployment & production hardening | Pending |

## Payments

- Amount: **KES 500** (hardcoded server-side)
- Providers: M-Pesa STK push (Daraja) and Paystack
- Audit is queued **only** after webhook confirmation
- Duplicate webhooks are idempotent
- Frontend payment status is never trusted

Required env vars (see `.env.example`):

- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, `MPESA_ENV`
- and/or `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`

Webhook URLs:

- `POST /api/payments/mpesa/callback`
- `POST /api/payments/paystack/webhook`

## Local setup

```bash
git clone https://github.com/Levy254885/hukan-seo-auditor.git
cd hukan-seo-auditor
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev
```

Repo: https://github.com/Levy254885/hukan-seo-auditor
