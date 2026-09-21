import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Hukan SEO Auditor
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--muted-foreground)]">
              <Link href="/features" className="hover:text-[var(--foreground)] transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors">
                Pricing
              </Link>
              <Link href="/how-it-works" className="hover:text-[var(--foreground)] transition-colors">
                How it works
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
            </nav>
            <Link
              href="/login"
              className="md:hidden rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm text-[var(--primary-foreground)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--muted-foreground)] mb-4">
              Professional SEO audits · KES 500 per website
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Know exactly what is holding your website back in search.
            </h1>
            <p className="mt-6 text-lg text-[var(--muted-foreground)] leading-relaxed">
              Hukan SEO Auditor crawls your site, checks technical SEO, on-page
              factors, performance signals, structured data, and AI search
              readiness — then delivers a clear score and a downloadable
              professional PDF report.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                Start an audit — KES 500
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-6 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* What is checked */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight">What every audit covers</h2>
            <p className="mt-3 text-[var(--muted-foreground)] max-w-xl">
              Deterministic checks. Real crawl data. No fabricated scores.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Technical SEO",
                  desc: "HTTPS, redirects, status codes, canonicals, robots.txt, sitemaps, indexability.",
                },
                {
                  title: "On-page SEO",
                  desc: "Titles, meta descriptions, headings, content length, image alt text, Open Graph.",
                },
                {
                  title: "Performance",
                  desc: "Core Web Vitals signals, page size, resource counts where measurable.",
                },
                {
                  title: "Structured data",
                  desc: "JSON-LD detection for Organization, Product, Article, FAQ and more.",
                },
                {
                  title: "Links & images",
                  desc: "Internal/external links, broken links, missing alt attributes.",
                },
                {
                  title: "AI Search / GEO",
                  desc: "Signals that help machines understand your business, services, and location.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing strip */}
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              One payment. One complete audit. No subscription required.
            </p>
            <div className="mt-10 inline-flex flex-col items-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-10 py-8">
              <span className="text-4xl font-semibold tracking-tight">KES 500</span>
              <span className="mt-1 text-sm text-[var(--muted-foreground)]">per website audit</span>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row justify-between gap-6 text-sm text-[var(--muted-foreground)]">
            <div>
              <p className="font-medium text-[var(--foreground)]">Hukan SEO Auditor</p>
              <p className="mt-1">Professional website SEO audits.</p>
            </div>
            <div className="flex flex-wrap gap-6">
              <Link href="/privacy" className="hover:text-[var(--foreground)]">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[var(--foreground)]">
                Terms
              </Link>
              <Link href="/refund-policy" className="hover:text-[var(--foreground)]">
                Refunds
              </Link>
              <Link href="/contact" className="hover:text-[var(--foreground)]">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
