"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/websites", label: "My Websites" },
  { href: "/dashboard/audits", label: "Audits" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/issues", label: "Issues" },
  { href: "/dashboard/fix-requests", label: "Fix requests" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
];

const adminItems = [
  { href: "/admin", label: "Admin Overview" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/fix-requests", label: "Fix Requests" },
];

type UserInfo = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export function DashboardShell({
  user,
  children,
}: {
  user: UserInfo;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)]">
      <header className="md:hidden border-b border-[var(--border)] flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="font-semibold text-sm tracking-tight">
          Hukan SEO Auditor
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </header>

      <aside
        className={cn(
          "border-r border-[var(--border)] bg-[var(--card)] w-full md:w-56 md:min-h-screen md:flex md:flex-col",
          mobileOpen ? "block" : "hidden md:flex"
        )}
      >
        <div className="hidden md:flex items-center h-14 px-4 border-b border-[var(--border)]">
          <Link href="/dashboard" className="font-semibold text-sm tracking-tight">
            Hukan SEO Auditor
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5" aria-label="Main">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Admin
              </div>
              {adminItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-[var(--border)]">
          <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] truncate">
            {user.email}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left rounded-md px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
