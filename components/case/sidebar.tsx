import type { AppealReadiness } from "../../types/case";
import { AsseraLogo } from "../brand/assera-logo";

interface CaseNavigationProps {
  readonly activityCount: number;
  readonly evidenceCount: number;
  readonly readiness: AppealReadiness;
  readonly hasDraft: boolean;
  readonly hasSubmission: boolean;
  readonly mobile?: boolean;
}

export function CaseNavigation({
  activityCount,
  evidenceCount,
  readiness,
  hasDraft,
  hasSubmission,
  mobile = false,
}: CaseNavigationProps) {
  const items = [
    { href: "#overview", label: "Overview" },
    { href: "#evidence", label: "Evidence", badge: String(evidenceCount) },
    {
      href: "#requirements",
      label: "Requirements",
      badge: `${readiness.summary.complete}/${readiness.summary.total}`,
    },
    { href: "#next-safe-step", label: "Next safe step" },
    ...(hasDraft
      ? [
          { href: "#appeal-workspace", label: "Appeal draft" },
          { href: "#appeal-package-review", label: "Review package" },
        ]
      : []),
    ...(hasSubmission
      ? [{ href: "#simulated-submission-receipt", label: "Simulated receipt" }]
      : []),
  ];

  return (
    <nav className={mobile ? "case-navigation mobile" : "case-navigation"} aria-label="Case workspace">
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          <span>{item.label}</span>
          {"badge" in item ? <span className="nav-badge">{item.badge}</span> : null}
        </a>
      ))}
      <a href="#workspace-activity">
        <span>Activity &amp; control</span>
        <span className="nav-badge">{activityCount}</span>
      </a>
    </nav>
  );
}

type SidebarProps = Omit<CaseNavigationProps, "mobile">;

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="case-sidebar">
      <div>
        <AsseraLogo showWord />
        <CaseNavigation {...props} />
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
