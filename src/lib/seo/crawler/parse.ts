import * as cheerio from "cheerio";

export type ParsedPage = {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  descriptionLength: number;
  h1: string | null;
  h1Count: number;
  headings: { level: number; text: string }[];
  wordCount: number;
  canonical: string | null;
  robotsMeta: string | null;
  lang: string | null;
  viewport: string | null;
  openGraph: Record<string, string>;
  twitterMeta: Record<string, string>;
  jsonLd: unknown[];
  internalLinks: string[];
  externalLinks: string[];
  images: { src: string; alt: string | null }[];
  imagesMissingAlt: number;
};

export function parseHtml(html: string, pageUrl: string): ParsedPage {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);

  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const h1Elements = $("h1");
  const h1 = h1Elements.first().text().trim() || null;

  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = el.tagName?.toLowerCase() || "";
    const level = Number(tag.replace("h", ""));
    const text = $(el).text().trim();
    if (text) headings.push({ level, text: text.slice(0, 200) });
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() || null;
  const robotsMeta =
    $('meta[name="robots"]').attr("content")?.trim() || null;
  const lang = $("html").attr("lang")?.trim() || null;
  const viewport =
    $('meta[name="viewport"]').attr("content")?.trim() || null;

  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr("property");
    const content = $(el).attr("content");
    if (property && content) openGraph[property] = content;
  });

  const twitterMeta: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr("name");
    const content = $(el).attr("content");
    if (name && content) twitterMeta[name] = content;
  });

  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      jsonLd.push(JSON.parse(raw));
    } catch {
      jsonLd.push({ _parseError: true, _rawPreview: raw.slice(0, 200) });
    }
  });

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const seenInternal = new Set<string>();
  const seenExternal = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }
    try {
      const absolute = new URL(href, base).toString();
      const u = new URL(absolute);
      if (u.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "")) {
        if (!seenInternal.has(absolute)) {
          seenInternal.add(absolute);
          internalLinks.push(absolute);
        }
      } else {
        if (!seenExternal.has(absolute)) {
          seenExternal.add(absolute);
          externalLinks.push(absolute);
        }
      }
    } catch {
      // ignore bad hrefs
    }
  });

  const images: { src: string; alt: string | null }[] = [];
  let imagesMissingAlt = 0;
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (!src) return;
    const alt = $(el).attr("alt");
    const altValue = alt === undefined ? null : alt;
    if (altValue === null || altValue.trim() === "") imagesMissingAlt += 1;
    images.push({ src, alt: altValue });
  });

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    descriptionLength: metaDescription?.length ?? 0,
    h1,
    h1Count: h1Elements.length,
    headings,
    wordCount,
    canonical,
    robotsMeta,
    lang,
    viewport,
    openGraph,
    twitterMeta,
    jsonLd,
    internalLinks,
    externalLinks,
    images,
    imagesMissingAlt,
  };
}
