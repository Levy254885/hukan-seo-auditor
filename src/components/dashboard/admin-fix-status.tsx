"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "RE_AUDIT",
  "CLOSED",
] as const;

export function AdminFixStatusForm({
  id,
  status,
  quotedAmount,
  agreedAmount,
  internalNotes,
  contactStatus,
}: {
  id: string;
  status: string;
  quotedAmount: number | null;
  agreedAmount: number | null;
  internalNotes: string | null;
  contactStatus: string | null;
}) {
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState(status);
  const [quoted, setQuoted] = useState(quotedAmount?.toString() || "");
  const [agreed, setAgreed] = useState(agreedAmount?.toString() || "");
  const [notes, setNotes] = useState(internalNotes || "");
  const [contact, setContact] = useState(contactStatus || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/fix-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: localStatus,
          quotedAmount: quoted ? Number(quoted) : null,
          agreedAmount: agreed ? Number(agreed) : null,
          internalNotes: notes || null,
          contactStatus: contact || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || "Save failed");
        return;
      }
      setMsg("Saved");
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-3 mt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[var(--muted-foreground)]">Status</label>
          <select
            value={localStatus}
            onChange={(e) => setLocalStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted-foreground)]">Contact status</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
            placeholder="e.g. Called 21 Sep"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted-foreground)]">Quoted (KES)</label>
          <input
            type="number"
            min={0}
            value={quoted}
            onChange={(e) => setQuoted(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted-foreground)]">Agreed (KES)</label>
          <input
            type="number"
            min={0}
            value={agreed}
            onChange={(e) => setAgreed(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-[var(--muted-foreground)]">Internal notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update"}
        </button>
        {msg && <span className="text-xs text-[var(--muted-foreground)]">{msg}</span>}
      </div>
    </div>
  );
}
