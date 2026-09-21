import { getSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Account details for this workspace.
      </p>

      <dl className="mt-8 space-y-4 rounded-lg border border-[var(--border)] p-5 text-sm">
        <div>
          <dt className="text-[var(--muted-foreground)]">Name</dt>
          <dd className="mt-0.5 font-medium">{session.user.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Email</dt>
          <dd className="mt-0.5 font-medium">{session.user.email}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Role</dt>
          <dd className="mt-0.5 font-medium">{session.user.role}</dd>
        </div>
      </dl>

      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
        Password change and notification preferences will be added in a later release.
      </p>
    </div>
  );
}
