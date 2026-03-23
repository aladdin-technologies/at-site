import { siteConfig } from "@/lib/site-config";
import { Divider } from "@/components/ui/divider";

/** Site footer with navigation columns, company details, and legal info */
export function Footer() {
  const { company, footer } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-accent-primary"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary">
                Airportronics
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              The intelligence layer for global airports. Benchmarking,
              analytics, and strategic insight for aviation leaders.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              Platform
            </h4>
            <ul className="mt-4 space-y-3">
              {footer.platform.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              Resources
            </h4>
            <ul className="mt-4 space-y-3">
              {footer.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              Company
            </h4>
            <ul className="mt-4 space-y-3">
              {footer.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Divider />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <div className="text-xs text-text-tertiary">
            <p>
              &copy; {year} {company.legal}. All rights reserved.
            </p>
            <p className="mt-1">
              Company Registration No. {company.registration} &middot;{" "}
              {company.address.slice(-2).join(", ")}
            </p>
          </div>
          <div className="text-xs text-text-tertiary">
            {company.address.slice(0, -2).join(", ")}
          </div>
        </div>
      </div>
    </footer>
  );
}
