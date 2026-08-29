import { AsseraLogo } from "../brand/assera-logo";
import { mayaCase } from "../../data/case-fixture";
import { mayaEvidence } from "../../data/evidence-fixture";
import { mayaCoveragePolicy } from "../../data/policy-fixture";
import { evaluateAppealReadiness } from "../../domain/readiness";

interface CaseNavigationProps {
  activityCount: number;
  mobile?: boolean;
}

const readiness = evaluateAppealReadiness(
  mayaCase.case_id,
  mayaCoveragePolicy,
  mayaEvidence,
);

const baseItems = [
  { href: "#overview", label: "Overview" },
  { href: "#evidence", label: "Evidence", badge: String(mayaEvidence.length) },
  {
    href: "#requirements",
    label: "Requirements",
    badge: `${readiness.summary.complete}/${readiness.summary.total}`,
  },
  { href: "#next-safe-step", label: "Next safe step" },
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
