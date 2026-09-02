import { formatIsoTimestamp } from "../../domain/format-date";
import type { AppealSubmission } from "../../types/case";

export function SubmissionReceipt({
  submission,
}: {
  readonly submission: AppealSubmission;
}) {
  return (
    <section
      id="simulated-submission-receipt"
      className="submission-receipt"
      tabIndex={-1}
      aria-labelledby="submission-receipt-title"
      aria-live="polite"
    >
      <div className="submission-receipt-heading">
        <div>
          <p className="receipt-eyebrow">ACT · SIMULATION COMPLETE</p>
          <h2 id="submission-receipt-title">Simulated submission receipt</h2>
          <p>
            ASSERA recorded one immutable simulation. No real insurer was
            contacted and no external network request occurred.
          </p>
        </div>
        <span className="receipt-status"><span aria-hidden="true">✓</span> RECORDED</span>
      </div>

      <div className="receipt-confirmation">
        <small>Simulated confirmation number</small>
        <strong>{submission.receipt.confirmation_number}</strong>
      </div>

      <dl className="receipt-metadata">
        <div><dt>Status</dt><dd>Simulated submission recorded</dd></div>
        <div><dt>Recorded</dt><dd>{formatIsoTimestamp(submission.submitted_at)}</dd></div>
        <div><dt>Initiated by</dt><dd>{submission.submitted_by.name} · {submission.submitted_by.provided_via}</dd></div>
        <div><dt>Destination</dt><dd>{submission.destination.name} · simulated payer portal</dd></div>
        <div><dt>Package</dt><dd>{submission.package_version}</dd></div>
        <div><dt>Human approval</dt><dd>{submission.approval_id}</dd></div>
      </dl>

      <div className="receipt-trust-note">
        <strong>Simulation only</strong>
        <span>Real insurer contacted: No</span>
        <span>External network request: No</span>
        <span>Synthetic demo data: Yes</span>
      </div>
    </section>
  );
}
