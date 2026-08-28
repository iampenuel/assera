import { AsseraLogo } from "../brand/assera-logo";

const navItems = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#our-approach", label: "Our approach" },
  { href: "#safety", label: "Safety" },
] as const;

function CasePill() {
  return (
    <a className="open-case-pill" href="/case/NS-PA-48291">
      <span>Open case</span>
      <span className="open-case-arrow" aria-hidden="true">↗</span>
    </a>
  );
}

export function SiteNav() {
  return (
    <header className="hero-nav">
      <AsseraLogo tone="ivory" />
      <nav className="hero-desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
        <CasePill />
      </nav>
      <div className="hero-mobile-actions">
        <CasePill />
        <details className="hero-mobile-menu">
          <summary aria-label="Open navigation menu">Menu</summary>
          <nav aria-label="Mobile navigation">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
