export type UserRole = "USER" | "ADMIN";

export type AuditStatus =
  | "PENDING_PAYMENT"
  | "QUEUED"
  | "CRAWLING"
  | "ANALYZING"
  | "SCORING"
  | "GENERATING_REPORT"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

export type FixRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "RE_AUDIT"
  | "CLOSED";

export type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface UserDoc {
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  image: string | null;
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
}

export interface WebsiteDoc {
  userId: string;
  url: string;
  domain: string;
  label: string | null;
  lastAuditAt: FirebaseFirestore.Timestamp | Date | null;
  latestScore: number | null;
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
}

export interface AuditDoc {
  publicId: string;
  userId: string;
  websiteId: string;
  url: string;
  domain: string;
  status: AuditStatus;
  crawlLimit: number;
  crawlDepth: number;
  excludePaths: string[];
  progress: number;
  progressMessage: string | null;
  errorMessage: string | null;
  overallScore: number | null;
  scoringVersion: string;
  pagesCrawled: number;
  issuesCount: number;
  criticalCount: number;
  highCount: number;
  technicalScore: number | null;
  onPageScore: number | null;
  contentScore: number | null;
  linksScore: number | null;
  imagesScore: number | null;
  performanceScore: number | null;
  structuredDataScore: number | null;
  mobileScore: number | null;
  localSeoScore: number | null;
  geoScore: number | null;
  startedAt: FirebaseFirestore.Timestamp | Date | null;
  completedAt: FirebaseFirestore.Timestamp | Date | null;
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
}

export interface PaymentDoc {
  userId: string;
  auditId: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerReference: string | null;
  phone: string | null;
  createdAt: FirebaseFirestore.Timestamp | Date;
  completedAt: FirebaseFirestore.Timestamp | Date | null;
  updatedAt: FirebaseFirestore.Timestamp | Date;
}

export interface JobDoc {
  auditId: string;
  stage: "crawl" | "report";
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  error: string | null;
  createdAt: FirebaseFirestore.Timestamp | Date;
  startedAt: FirebaseFirestore.Timestamp | Date | null;
  completedAt: FirebaseFirestore.Timestamp | Date | null;
}

export const COLLECTIONS = {
  users: "users",
  websites: "websites",
  audits: "audits",
  payments: "payments",
  fixRequests: "fixRequests",
  notifications: "notifications",
  jobs: "jobs",
  rateLimits: "rateLimits",
} as const;
