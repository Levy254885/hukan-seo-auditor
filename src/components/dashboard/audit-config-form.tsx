"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuditConfigForm({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const [crawlLimit, setCrawlLimit] = useState(50);
  const [crawlDepth, setCrawlDepth] = useState(3);
  const [excludePaths, setExcludePaths] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const exclude = excludePaths.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, crawlLimit, crawlDepth, excludePaths: exclude }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create audit.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/audits/${data.audit.publicId}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5 max-w-md">
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <div>
        <label htmlFor="crawlLimit" className="block text-sm font-medium mb-1.5">Crawl limit</label>
        <input id="crawlLimit" type="number" min={5} max={100} value={crawlLimit} onChange={(e) => setCrawlLimit(Number(e.target.value))} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Maximum pages to crawl (5–100). Default 50 for the KES 500 audit.</p>
      </div>
      <div>
        <label htmlFor="crawlDepth" className="block text-sm font-medium mb-1.5">Crawl depth</label>
        <input id="crawlDepth" type="number" min={1} max={5} value={crawlDepth} onChange={(e) => setCrawlDepth(Number(e.target.value))} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">How many clicks from the homepage (1–5). Default 3.</p>
      </div>
      <div>
        <label htmlFor="excludePaths" className="block text-sm font-medium mb-1.5">Exclude paths <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></label>
        <input id="excludePaths" type="text" value={excludePaths} onChange={(e) => setExcludePaths(e.target.value)} placeholder="/admin, /cart, /wp-login.php" className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Comma-separated path prefixes to skip.</p>
      </div>
      <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 text-sm">
        <p className="font-medium">This audit includes</p>
        <ul className="mt-2 list-disc pl-5 text-[var(--muted-foreground)] space-y-1">
          <li>Technical SEO (HTTPS, status codes, canonicals, robots, sitemap)</li>
          <li>On-page SEO (titles, descriptions, headings, images)</li>
          <li>Links, structured data, mobile, local, and GEO signals</li>
          <li>Score breakdown and issue list</li>
          <li>Dashboard report and PDF (after analysis completes)</li>
        </ul>
        <p className="mt-3 font-medium">Price: KES 500</p>
      </div>
      <button type="submit" disabled={loading} className="rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
        {loading ? "Creating audit…" : "Continue to payment"}
      </button>
    </form>
  );
}
