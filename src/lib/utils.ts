import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function normalizeUrl(input: string): string | null {
  try {
    let url = input.trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    // Strip trailing slash for consistency (except root)
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
