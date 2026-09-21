const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function paymentConfirmedEmail(opts: {
  name?: string | null;
  domain: string;
  amount: number;
  currency: string;
  auditPublicId: string;
}) {
  const subject = `Payment confirmed — audit queued for ${opts.domain}`;
  const text = [
    `Hi${opts.name ? ` ${opts.name}` : ""},`,
    ``,
    `We received your payment of ${opts.currency} ${opts.amount} for ${opts.domain}.`,
    `Your SEO audit is now queued and will start shortly.`,
    ``,
    `Track progress: ${appUrl()}/dashboard/audits/${opts.auditPublicId}`,
    ``,
    `— Hukan SEO Auditor`,
  ].join("\n");
  return { subject, text };
}

export function auditCompletedEmail(opts: {
  name?: string | null;
  domain: string;
  score: number | null;
  issuesCount: number;
  auditPublicId: string;
}) {
  const subject = `Audit complete — ${opts.domain}${opts.score != null ? ` (score ${opts.score})` : ""}`;
  const text = [
    `Hi${opts.name ? ` ${opts.name}` : ""},`,
    ``,
    `Your SEO audit for ${opts.domain} is complete.`,
    opts.score != null ? `Overall score: ${opts.score}/100` : `Score: not available`,
    `Issues found: ${opts.issuesCount}`,
    ``,
    `View report: ${appUrl()}/dashboard/audits/${opts.auditPublicId}`,
    `Download PDF: ${appUrl()}/api/audits/${opts.auditPublicId}/pdf`,
    ``,
    `— Hukan SEO Auditor`,
  ].join("\n");
  return { subject, text };
}

export function fixRequestReceivedEmail(opts: {
  name?: string | null;
  domain: string;
}) {
  const subject = `We received your fix request — ${opts.domain}`;
  const text = [
    `Hi${opts.name ? ` ${opts.name}` : ""},`,
    ``,
    `Thanks for requesting SEO implementation help for ${opts.domain}.`,
    `Our team will review the audit and contact you with next steps.`,
    ``,
    `Track status: ${appUrl()}/dashboard/fix-requests`,
    ``,
    `— Hukan SEO Auditor`,
  ].join("\n");
  return { subject, text };
}

export function fixRequestStatusEmail(opts: {
  name?: string | null;
  domain: string;
  status: string;
}) {
  const label = opts.status.replace(/_/g, " ").toLowerCase();
  const subject = `Fix request update — ${opts.domain} is now ${label}`;
  const text = [
    `Hi${opts.name ? ` ${opts.name}` : ""},`,
    ``,
    `Your SEO fix request for ${opts.domain} is now: ${label}.`,
    ``,
    `View details: ${appUrl()}/dashboard/fix-requests`,
    ``,
    `— Hukan SEO Auditor`,
  ].join("\n");
  return { subject, text };
}

export function welcomeEmail(opts: { name?: string | null }) {
  const subject = "Welcome to Hukan SEO Auditor";
  const text = [
    `Hi${opts.name ? ` ${opts.name}` : ""},`,
    ``,
    `Welcome. Professional SEO audits are KES 500 each.`,
    ``,
    `Get started: ${appUrl()}/dashboard/websites/new`,
    ``,
    `— Hukan SEO Auditor`,
  ].join("\n");
  return { subject, text };
}
