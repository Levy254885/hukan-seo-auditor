# Production deployment — Hukan SEO Auditor

## Recommended stack

| Component | Option A | Option B |
|-----------|----------|----------|
| App | Vercel | Docker on Railway / Fly / VPS |
| Database | Neon / Supabase Postgres | Managed Postgres |
| Worker | Separate process (`npm run worker`) or cron hitting `/api/audits/process` | Same |
| Email | Resend | SMTP |
| Payments | M-Pesa Daraja + Paystack webhooks | — |

## Checklist

1. Create Postgres and set `DATABASE_URL`
2. Set secrets (never commit):
   - `NEXTAUTH_SECRET` (32+ random chars)
   - `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` = production HTTPS origin
   - `ADMIN_EMAIL`
   - Payment provider keys + webhook URLs pointing at production
   - `RESEND_API_KEY` + `EMAIL_FROM`
   - `CRON_SECRET` for `/api/audits/process`
3. `npx prisma migrate deploy` or `npx prisma db push`
4. Deploy app; run worker as a long-lived process
5. Configure M-Pesa callback: `https://YOUR_DOMAIN/api/payments/mpesa/callback`
6. Configure Paystack webhook: `https://YOUR_DOMAIN/api/payments/paystack/webhook`
7. Hit `GET /api/health` — expect `"status":"ok"`

## Vercel notes

- Serverless functions cannot run long crawls reliably. Prefer an external worker or a platform that supports background processes.
- Cron in `vercel.json` can call process endpoint; protect with `CRON_SECRET`.

## Docker

```bash
docker compose up --build
docker compose exec app npx prisma db push
```

## Security

- Do not commit `.env`
- Webhooks must verify signatures / provider fields
- Crawler blocks private IPs (SSRF protection)
- Admin routes require `role === ADMIN`
