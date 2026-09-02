interface WorkflowContinuationProps {
  readonly id: string;
  readonly state:
    | "ready-to-prepare"
    | "draft-prepared"
    | "receipt-recorded";
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly primaryLabel: string;
  readonly statusLabel: string;
  readonly onPrimary: () => unknown;
}

export function WorkflowContinuation({
  id,
  state,
  eyebrow,
  title,
  description,
  primaryLabel,
  statusLabel,
  onPrimary,
}: WorkflowContinuationProps) {
  const titleId = `${id}-title`;
  const isRecorded = state === "receipt-recorded";

  return (
    <section
      id={id}
      className={`workflow-continuation is-${state}`}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-live="polite"
    >
      <div className="workflow-continuation-copy">
        <p className="case-section-label">
          {isRecorded ? (
            <span className="workflow-verified-mark" aria-hidden="true">
              ✓
            </span>
          ) : null}
          {eyebrow}
        </p>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="workflow-continuation-actions">
        <button type="button" onClick={onPrimary}>
          {primaryLabel} <span aria-hidden="true">→</span>
        </button>
        <span className="workflow-status">{statusLabel}</span>
      </div>
    </section>
  );
}
