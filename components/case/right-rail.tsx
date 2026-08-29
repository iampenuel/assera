import type {
  CaseWorkspaceSnapshot,
  PrepareAppealResult,
  WebMCPStatus,
  WorkspaceActivity,
} from "../../types/case";

const statusCopy: Record<WebMCPStatus, { label: string; className: string; detail?: string }> = {
  checking: { label: "Connecting", className: "checking" },
  available: { label: "Active", className: "active" },
  unavailable: { label: "Preview mode", className: "preview", detail: "WebMCP is not available in this browser. Human confirmation and local draft preparation remain available." },
  error: { label: "Unavailable", className: "unavailable", detail: "The WebMCP tools could not connect. No case information was affected." },
};

function formatActivityTime(occurredAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(occurredAt));
}

function NextSafeStep({
  snapshot,
  onReviewDates,
  onPrepare,
  onReviewDraft,
}: {
  readonly snapshot: CaseWorkspaceSnapshot;
  readonly onReviewDates: () => void;
  readonly onPrepare: () => PrepareAppealResult;
  readonly onReviewDraft: () => void;
}) {
  if (snapshot.appealDraft) {
    return (
      <section id="next-safe-step" className="rail-card next-step-card" aria-labelledby="next-step-title">
        <p className="case-section-label">NEXT SAFE STEP</p>
        <h2 id="next-step-title">Review the appeal draft</h2>
        <p>A structured draft is ready in ASSERA. Nothing has been submitted.</p>
        <button type="button" onClick={onReviewDraft}>Review draft <span aria-hidden="true">→</span></button>
      </section>
    );
  }

  if (snapshot.readiness.ready_to_prepare) {
    return (
      <section id="next-safe-step" className="rail-card next-step-card" aria-labelledby="next-step-title">
        <p className="case-section-label">NEXT SAFE STEP</p>
        <h2 id="next-step-title">Prepare the appeal draft</h2>
        <p>All five administrative requirements are complete. Your agent or you can now prepare a local draft.</p>
        <button type="button" onClick={onPrepare}>Prepare appeal draft <span aria-hidden="true">→</span></button>
        <small>You can also ask your agent to prepare it.</small>
      </section>
    );
  }

  return (
    <section id="next-safe-step" className="rail-card next-step-card" aria-labelledby="next-step-title">
      <p className="case-section-label">NEXT SAFE STEP</p>
      <h2 id="next-step-title">Confirm treatment dates</h2>
      <p>Confirm the start and end dates of physical therapy so ASSERA can complete the readiness check.</p>
      <button type="button" onClick={onReviewDates}>Review &amp; confirm dates <span aria-hidden="true">→</span></button>
    </section>
  );
}

function AgentPermissions({
  status,
  snapshot,
}: {
  readonly status: WebMCPStatus;
  readonly snapshot: CaseWorkspaceSnapshot;
}) {
  const readStatus = statusCopy[status];
  const prepareState = snapshot.appealDraft
    ? {
        label: "Draft prepared",
        className: "prepared",
        detail: "A draft exists in ASSERA and remains unsubmitted.",
      }
    : snapshot.readiness.ready_to_prepare
      ? {
          label: "Available",
          className: "active",
          detail: "Your agent or you can prepare a local appeal draft. Nothing will be submitted.",
        }
      : {
          label: "Blocked",
          className: "blocked",
          detail: "Confirm treatment dates before an appeal draft can be prepared.",
        };

  return (
    <section className="rail-card permissions-card" aria-labelledby="permissions-title">
      <p id="permissions-title" className="case-section-label">AGENT ACCESS &amp; PERMISSIONS</p>
      <dl>
        <div>
          <dt>READ</dt><dd>Your agent can read denial details, coverage requirements, available evidence, and readiness.</dd>
          <span className={`permission-status ${readStatus.className}`}>{readStatus.label}</span>
        </div>
        <div>
          <dt>PREPARE</dt><dd>{prepareState.detail}</dd>
          <span className={`permission-status ${prepareState.className}`}>{prepareState.label}</span>
        </div>
        <div>
          <dt>ACT</dt><dd>No submission tool exists in this milestone. Future consequential actions will require explicit approval.</dd>
          <span className="permission-status neutral">Not available</span>
        </div>
      </dl>
      {readStatus.detail ? <p className="permission-detail">{readStatus.detail}</p> : null}
    </section>
  );
}

function ActivityPanel({ activities }: { activities: readonly WorkspaceActivity[] }) {
  return (
    <section id="workspace-activity" className="rail-card recent-activity" aria-labelledby="activity-title" aria-live="polite">
      <p id="activity-title" className="case-section-label">RECENT ACTIVITY</p>
      {activities.length === 0 ? (
        <div className="activity-empty"><h2>No workspace activity yet</h2><p>Agent reads and preparation steps will appear here with their impact.</p></div>
      ) : (
        <ol>
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="activity-meta">
                <span>
                  <strong>{activity.category}</strong>
                  <em>{activity.actor}</em>
                  {activity.outcome === "blocked" ? <em className="is-blocked">BLOCKED</em> : null}
                </span>
                <time dateTime={activity.occurredAt}>{formatActivityTime(activity.occurredAt)}</time>
              </div>
              <h2>{activity.title}</h2>
              <p>{activity.impact}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function RightRail({
  snapshot,
  status,
  onReviewDates,
  onPrepare,
  onReviewDraft,
}: {
  readonly snapshot: CaseWorkspaceSnapshot;
  readonly status: WebMCPStatus;
  readonly onReviewDates: () => void;
  readonly onPrepare: () => PrepareAppealResult;
  readonly onReviewDraft: () => void;
}) {
  return (
    <aside className="case-right-rail" aria-label="Case actions and agent access">
      <NextSafeStep
        snapshot={snapshot}
        onReviewDates={onReviewDates}
        onPrepare={onPrepare}
        onReviewDraft={onReviewDraft}
      />
      <AgentPermissions status={status} snapshot={snapshot} />
      <ActivityPanel activities={snapshot.activities} />
      <div className="control-reassurance">
        <span aria-hidden="true">⌑</span>
        <p><strong>You approve consequential actions.</strong><br />Nothing is sent without your approval.</p>
      </div>
    </aside>
  );
}
