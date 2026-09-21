import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google.com",
]);

const PRIVATE_IPV4 = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^255\./,
];

function isPrivateIpv4(ip: string): boolean {
  if (PRIVATE_IPV4.some((re) => re.test(ip))) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const octet = Number(m[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  return false;
}

export function parsePublicHttpUrl(input: string): URL | null {
  try {
    let raw = input.trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

export function getDomainFromUrl(url: URL | string): string {
  const hostname = typeof url === "string" ? new URL(url).hostname : url.hostname;
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function normalizeWebsiteUrl(url: URL): string {
  const copy = new URL(url.toString());
  copy.hash = "";
  if (copy.pathname !== "/" && copy.pathname.endsWith("/")) {
    copy.pathname = copy.pathname.slice(0, -1);
  }
  return copy.toString();
}

export async function assertSafeCrawlTarget(url: URL): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const host = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, reason: "This hostname is not allowed." };
  }

  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    return { ok: false, reason: "Internal hostnames are not allowed." };
  }

  const ipLiteral = isIP(host);
  if (ipLiteral === 4 && isPrivateIpv4(host)) {
    return { ok: false, reason: "Private IP addresses are not allowed." };
  }
  if (ipLiteral === 6 && isPrivateIpv6(host)) {
    return { ok: false, reason: "Private IP addresses are not allowed." };
  }

  if (ipLiteral === 0) {
    try {
      const records = await lookup(host, { all: true });
      for (const rec of records) {
        if (rec.family === 4 && isPrivateIpv4(rec.address)) {
          return { ok: false, reason: "This domain resolves to a private address." };
        }
        if (rec.family === 6 && isPrivateIpv6(rec.address)) {
          return { ok: false, reason: "This domain resolves to a private address." };
        }
      }
    } catch {
      return { ok: false, reason: "Could not resolve this domain." };
    }
  }

  return { ok: true };
}

export const DEFAULT_CRAWL_LIMIT = 50;
export const DEFAULT_CRAWL_DEPTH = 3;
export const MAX_CRAWL_LIMIT = 100;
export const MAX_CRAWL_DEPTH = 5;
export const AUDIT_PRICE_KES = 500;
