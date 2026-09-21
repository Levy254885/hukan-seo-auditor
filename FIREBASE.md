# Firebase backend — Hukan SEO Auditor

Primary backend: **Firebase Auth + Cloud Firestore**.
Next.js UI calls API routes with `Authorization: Bearer <Firebase ID token>`.
Server uses **Firebase Admin SDK**. Crawl worker claims jobs from Firestore.

## Collections

`users`, `websites`, `audits` (+ `pages`/`issues` subcollections), `payments`, `fixRequests`, `notifications`, `jobs`, `rateLimits`

## Security

- Clients cannot complete payments or write scores
- `jobs` and `rateLimits` are Admin SDK only
- `ADMIN_EMAIL` promotes that account to ADMIN on session verify

## Rate limits (Firestore transactions)

- Payment create: 10/hour/user
- Audit create: 20/hour/user
- Auth IP: 30/15min
- Fix requests: 5/hour/user

## Setup

1. Create Firebase project; enable Email/Password auth + Firestore
2. Add web config + service account to `.env` (see `.env.example`)
3. `firebase deploy --only firestore:rules,firestore:indexes`
4. Deploy functions from `/functions`

## API (Firebase path)

- `POST/GET /api/firebase/session`
- `GET/POST /api/firebase/websites`
- `GET/POST /api/firebase/audits`

See full notes in this file’s longer version in the repo source tree.

Prisma routes remain until the UI fully switches to `FirebaseAuthProvider`.
