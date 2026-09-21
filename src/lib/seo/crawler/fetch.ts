import { assertSafeCrawlTarget, parsePublicHttpUrl } from "@/lib/seo/url";

const DEFAULT_TIMEOUT_MS = Number(process.env.CRAWLER_TIMEOUT_MS || 15000);
const MAX_RESPONSE_BYTES = 2_000_000;
const USER_AGENT =
  process.env.CRAWLER_USER_AGENT ||
  "HukanSEOAuditor/1.0 (+https://hukan.example/bot)";

export type FetchResult = {
  url: string;
  finalUrl: string;
  statusCode: number;
  responseTimeMs: number;
  contentType: string | null;
  html: string | null;
  redirectedFrom: string | null;
  error: string | null;
};

export async function fetchPage(rawUrl: string): Promise<FetchResult> {
  const started = Date.now();
  const parsed = parsePublicHttpUrl(rawUrl);
  if (!parsed) {
    return emptyResult(rawUrl, started, "Invalid URL");
  }

  const safety = await assertSafeCrawlTarget(parsed);
  if (!safety.ok) {
    return emptyResult(rawUrl, started, safety.reason || "Blocked target");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const finalUrl = res.url || parsed.toString();
    const finalParsed = parsePublicHttpUrl(finalUrl);
    if (!finalParsed) {
      return {
        url: rawUrl,
        finalUrl,
        statusCode: res.status,
        responseTimeMs: Date.now() - started,
        contentType: null,
        html: null,
        redirectedFrom: finalUrl !== rawUrl ? rawUrl : null,
        error: "Invalid final URL after redirect",
      };
    }
    const finalSafety = await assertSafeCrawlTarget(finalParsed);
    if (!finalSafety.ok) {
      return {
        url: rawUrl,
        finalUrl,
        statusCode: res.status,
        responseTimeMs: Date.now() - started,
        contentType: null,
        html: null,
        redirectedFrom: finalUrl !== rawUrl ? rawUrl : null,
        error: finalSafety.reason || "Blocked redirect target",
      };
    }

    const contentType = res.headers.get("content-type");
    let html: string | null = null;

    if (contentType && contentType.includes("text/html")) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength <= MAX_RESPONSE_BYTES) {
        html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      } else {
        return {
          url: rawUrl,
          finalUrl,
          statusCode: res.status,
          responseTimeMs: Date.now() - started,
          contentType,
          html: null,
          redirectedFrom: finalUrl !== rawUrl ? rawUrl : null,
          error: "Response too large",
        };
      }
    }

    return {
      url: rawUrl,
      finalUrl,
      statusCode: res.status,
      responseTimeMs: Date.now() - started,
      contentType,
      html,
      redirectedFrom: finalUrl !== rawUrl ? rawUrl : null,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Request timed out"
          : error.message
        : "Fetch failed";
    return emptyResult(rawUrl, started, message);
  } finally {
    clearTimeout(timeout);
  }
}

function emptyResult(url: string, started: number, error: string): FetchResult {
  return {
    url,
    finalUrl: url,
    statusCode: 0,
    responseTimeMs: Date.now() - started,
    contentType: null,
    html: null,
    redirectedFrom: null,
    error,
  };
}
