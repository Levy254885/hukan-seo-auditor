"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewWebsitePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add website.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/websites/${data.website.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <p className="text-sm text-[var(--muted-foreground)] mb-2">
        <Link href="/dashboard/websites" className="hover:underline">
          My Websites
        </Link>{" "}/ Add
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Add a website</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Enter the public URL you want to audit. Localhost and private network
        addresses are rejected.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1.5">Website URL</label>
          <input id="url" type="text" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">Display name <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Company website" className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
            {loading ? "Adding…" : "Add website"}
          </button>
          <Link href="/dashboard/websites" className="rounded-md border border-[var(--border)] px-4 py-2.5 text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
