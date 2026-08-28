import type { AgentActivity, WebMCPStatus } from "../../types/case";

const statusCopy: Record<WebMCPStatus, { label: string; className: string; detail?: string }> = {
  checking: { label: "Connecting", className: "checking" },
  available: { label: "Active", className: "active" },
  unavailable: { label: "Preview mode", className: "preview", detail: "WebMCP is not available in this browser." },
  error: { label: "Unavailable", className: "unavailable", detail: "The read tool could not connect. No case information was affected." },
};

function formatActivityTime(occurredAt: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(occurredAt));
}

function NextSafeStep({ onReviewDates }: { onReviewDates: () => void }) {
  return (
    <section id="next-safe-step" className="rail-card next-step-card" aria-labelledby="next-step-title">
      <p className="case-section-label">NEXT SAFE STEP</p>
      <h2 id="next-step-title">Confirm treatment dates</h2>
      <p>Confirm the start and end dates of your physical therapy so ASSERA can complete your appeal package.</p>
      <button type="button" onClick={onReviewDates}>Review &amp; confirm dates <span aria-hidden="true">→</span></button>
    </section>
  );
}

function AgentPermissions({ status }: { status: WebMCPStatus }) {
  const readStatus = statusCopy[status];
  return (
    <section className="rail-card permissions-card" aria-labelledby="permissions-title">
      <p id="permissions-title" className="case-section-label">AGENT ACCESS &amp; PERMISSIONS</p>
      <dl>
        <div>
          <dt>READ</dt><dd>Your agent can read case information.</dd>
          <span className={`permission-status ${readStatus.className}`}>{readStatus.label}</span>
        </div>
        <div>
          <dt>PREPARE</dt><dd>Your agent can prepare documents.</dd>
          <span className="permission-status neutral">Not used</span>
        </div>
        <div>
          <dt>ACT</dt><dd>Consequential actions require your approval.</dd>
          <span className="permission-status neutral">Approval required</span>
        </div>
      </dl>
      {readStatus.detail ? <p className="permission-detail">{readStatus.detail}</p> : null}
    </section>
  );
}

function ActivityPanel({ activities }: { activities: AgentActivity[] }) {
  return (
    <section id="agent-activity" className="rail-card recent-activity" aria-labelledby="activity-title" aria-live="polite">
      <p id="activity-title" className="case-section-label">RECENT ACTIVITY</p>
      {activities.length === 0 ? (
        <div className="activity-empty"><h2>No agent activity yet</h2><p>Agent reads will appear here with their impact.</p></div>
      ) : (
        <ol>
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="activity-meta"><strong>{activity.category}</strong><time dateTime={activity.occurredAt}>{formatActivityTime(activity.occurredAt)}</time></div>
              <h2>{activity.title}</h2>
              <p>{activity.impact}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function RightRail({ activities, status, onReviewDates }: { activities: AgentActivity[]; status: WebMCPStatus; onReviewDates: () => void }) {
  return (
    <aside className="case-right-rail" aria-label="Case actions and agent access">
      <NextSafeStep onReviewDates={onReviewDates} />
      <AgentPermissions status={status} />
      <ActivityPanel activities={activities} />
      <div className="control-reassurance">
        <span aria-hidden="true">⌑</span>
        <p><strong>You approve consequential actions.</strong><br />Nothing is sent without your approval.</p>
      </div>
    </aside>
  );
}
