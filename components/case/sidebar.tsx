import { AsseraLogo } from "../brand/assera-logo";

interface CaseNavigationProps {
  activityCount: number;
  mobile?: boolean;
}

const baseItems = [
  { href: "#overview", label: "Overview" },
  { href: "#evidence", label: "Evidence", badge: "4" },
  { href: "#requirements", label: "Requirements", badge: "4/5" },
  { href: "#next-safe-step", label: "Appeal package" },
] as const;

export function CaseNavigation({ activityCount, mobile = false }: CaseNavigationProps) {
  return (
    <nav className={mobile ? "case-navigation mobile" : "case-navigation"} aria-label="Case workspace">
      {baseItems.map((item) => (
        <a key={item.href} href={item.href}>
          <span>{item.label}</span>
          {"badge" in item ? <span className="nav-badge">{item.badge}</span> : null}
        </a>
      ))}
      <a href="#agent-activity">
        <span>Agent activity</span>
        <span className="nav-badge">{activityCount}</span>
      </a>
    </nav>
  );
}

export function Sidebar({ activityCount }: { activityCount: number }) {
  return (
    <aside className="case-sidebar">
      <div>
        <AsseraLogo showWord />
        <CaseNavigation activityCount={activityCount} />
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <p className="sidebar-help-icon" aria-hidden="true">?</p>
          <h2>Need help?</h2>
          <p>Learn how ASSERA works with your agent.</p>
          <a href="/#how-it-works">See how it works <span aria-hidden="true">→</span></a>
        </div>
        <div className="sidebar-signoff">
          <strong>ASSERA</strong>
          <span>A denial isn&apos;t the final word.</span>
        </div>
      </div>
    </aside>
  );
}
