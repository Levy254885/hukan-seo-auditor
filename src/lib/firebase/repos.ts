import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/types/firestore";
import type { AuditDoc, WebsiteDoc, PaymentDoc, JobDoc } from "@/types/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

function db() {
  return getAdminDb();
}

export async function createWebsite(input: {
  userId: string;
  url: string;
  domain: string;
  label?: string | null;
}) {
  const ref = db().collection(COLLECTIONS.websites).doc();
  const doc = {
    userId: input.userId,
    url: input.url,
    domain: input.domain,
    label: input.label || null,
    lastAuditAt: null,
    latestScore: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(doc);
  return { id: ref.id, ...doc };
}

export async function listWebsitesForUser(userId: string, limit = 50) {
  const snap = await db()
    .collection(COLLECTIONS.websites)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WebsiteDoc) }));
}

export async function createAudit(input: {
  userId: string;
  websiteId: string;
  url: string;
  domain: string;
  crawlLimit: number;
  crawlDepth: number;
  excludePaths?: string[];
}) {
  const ref = db().collection(COLLECTIONS.audits).doc();
  const publicId = `aud_${nanoid(12)}`;
  const doc = {
    publicId,
    userId: input.userId,
    websiteId: input.websiteId,
    url: input.url,
    domain: input.domain,
    status: "PENDING_PAYMENT" as const,
    crawlLimit: input.crawlLimit,
    crawlDepth: input.crawlDepth,
    excludePaths: input.excludePaths || [],
    progress: 0,
    progressMessage: "Awaiting payment",
    errorMessage: null,
    overallScore: null,
    scoringVersion: "1.0",
    pagesCrawled: 0,
    issuesCount: 0,
    criticalCount: 0,
    highCount: 0,
    technicalScore: null,
    onPageScore: null,
    contentScore: null,
    linksScore: null,
    imagesScore: null,
    performanceScore: null,
    structuredDataScore: null,
    mobileScore: null,
    localSeoScore: null,
    geoScore: null,
    startedAt: null,
    completedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(doc);
  return { id: ref.id, ...doc };
}

export async function getAuditByPublicId(publicId: string, userId?: string) {
  const snap = await db()
    .collection(COLLECTIONS.audits)
    .where("publicId", "==", publicId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const data = doc.data() as AuditDoc;
  if (userId && data.userId !== userId) return null;
  return { id: doc.id, ...data };
}

export async function createPayment(input: {
  userId: string;
  auditId: string;
  provider: string;
  phone?: string | null;
}) {
  const ref = db().collection(COLLECTIONS.payments).doc();
  const doc = {
    userId: input.userId,
    auditId: input.auditId,
    amount: 500,
    currency: "KES",
    provider: input.provider,
    status: "PENDING" as const,
    providerReference: null,
    checkoutRequestId: null,
    merchantRequestId: null,
    phone: input.phone || null,
    failureReason: null,
    metadata: null,
    createdAt: FieldValue.serverTimestamp(),
    completedAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(doc);
  return { id: ref.id, ...doc };
}

export async function completePaymentAndQueueAudit(input: {
  paymentId: string;
  providerReference: string;
  metadata?: Record<string, unknown>;
}) {
  const paymentRef = db().collection(COLLECTIONS.payments).doc(input.paymentId);

  return db().runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef);
    if (!paymentSnap.exists) throw new Error("Payment not found");
    const payment = paymentSnap.data() as PaymentDoc;

    if (payment.status === "COMPLETED") {
      return { alreadyCompleted: true, payment };
    }

    tx.update(paymentRef, {
      status: "COMPLETED",
      providerReference: input.providerReference,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      metadata: input.metadata || null,
    });

    const auditRef = db().collection(COLLECTIONS.audits).doc(payment.auditId);
    tx.update(auditRef, {
      status: "QUEUED",
      progress: 5,
      progressMessage: "Payment confirmed. Audit queued.",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const jobRef = db().collection(COLLECTIONS.jobs).doc();
    tx.set(jobRef, {
      auditId: payment.auditId,
      stage: "crawl",
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      error: null,
      createdAt: FieldValue.serverTimestamp(),
      startedAt: null,
      completedAt: null,
    });

    return { alreadyCompleted: false, payment, jobId: jobRef.id };
  });
}

export async function claimNextCrawlJob() {
  const snap = await db()
    .collection(COLLECTIONS.jobs)
    .where("status", "==", "pending")
    .where("stage", "==", "crawl")
    .orderBy("createdAt", "asc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  await doc.ref.update({
    status: "running",
    attempts: FieldValue.increment(1),
    startedAt: FieldValue.serverTimestamp(),
  });
  return { id: doc.id, ...(doc.data() as JobDoc) };
}

export { FieldValue };
