"use client";

import { useState } from "react";
import { AppealApprovalError } from "../../domain/appeal-package";
import { formatIsoDate, formatIsoTimestamp } from "../../domain/format-date";
import type {
  AppealApproval,
  AppealPackagePreview,
  SharedInformationSource,
} from "../../types/case";

const sourceLabels: Record<SharedInformationSource, string> = {
  case_record: "Case record",
  insurer_source: "Insurer source",
  human_confirmed: "Confirmed by Maya",
  assera_draft: "ASSERA draft",
};

interface AppealPackageReviewProps {
  readonly preview: AppealPackagePreview;
  readonly onApprove: (
    packageVersion: string,
    confirmation: boolean,
  ) => AppealApproval;
  readonly onRevoke: () => boolean;
}

function displaySharedValue(
  field: string,
  value: string,
  preview: AppealPackagePreview,
): string {
  if (field === "treatment_start_date" || field === "treatment_end_date") {
    return formatIsoDate(value, true);
  }
  if (field === "appeal_statement") return `Current draft v${preview.draft_version}`;
  if (field === "included_documents") {
    return `${preview.included_documents.length} listed documents`;
  }
  return value;
}

export function AppealPackageReview({
  preview,
  onApprove,
  onRevoke,
}: AppealPackageReviewProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isApproved = preview.approval.status === "approved";

  const handleApprove = () => {
    setError(null);
    try {
      onApprove(preview.package_version, confirmed);
    } catch (caught) {
      setError(
        caught instanceof AppealApprovalError
          ? caught.message
          : "The package could not be approved. Review the current version and try again.",
      );
    }
  };

  return (
    <section
      id="appeal-package-review"
      className={`appeal-package-review ${isApproved ? "is-approved" : ""}`}
      tabIndex={-1}
      aria-labelledby="appeal-package-review-title"
      aria-live="polite"
    >
      <div className="package-review-heading">
        <div>
          <p className="package-eyebrow">
            {isApproved
              ? "APPROVED LOCALLY — NOT SUBMITTED"
              : "REVIEW — NOT SUBMITTED"}
          </p>
          <h2 id="appeal-package-review-title">Review the appeal package</h2>
          <p>
            Review exactly what would be shared with Northstar Health during a
            future simulated submission.
          </p>
        </div>
        <span className="package-version">Package v{preview.draft_version}</span>
      </div>

      <div className="package-review-grid">
        <section className="package-review-block destination-block" aria-labelledby="package-destination-title">
          <p className="package-section-number" aria-hidden="true">01</p>
          <div>
            <h3 id="package-destination-title">Destination</h3>
            <strong>{preview.destination.name}</strong>
            <span>Simulated payer portal</span>
            <small>No real payer connection is used.</small>
          </div>
        </section>

        <section
          id="package-statement"
          className="package-review-block statement-block"
          tabIndex={-1}
          aria-labelledby="package-statement-title"
        >
          <p className="package-section-number" aria-hidden="true">02</p>
          <div>
            <h3 id="package-statement-title">Appeal statement</h3>
            <p className="package-statement">{preview.statement}</p>
          </div>
        </section>

        <section className="package-review-block package-documents" aria-labelledby="package-documents-title">
          <p className="package-section-number" aria-hidden="true">03</p>
          <div>
            <h3 id="package-documents-title">Documents included</h3>
            <ol>
              {preview.included_documents.map((document) => (
                <li key={document.id}>
                  <div>
                    <strong>{document.name}</strong>
                    <span>{document.source} · {formatIsoDate(document.document_date)}</span>
                  </div>
                  <em className={document.role === "denial_context" ? "denial-context" : "supporting-evidence"}>
                    {document.role === "denial_context"
                      ? "Denial context"
                      : "Supporting evidence"}
                  </em>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="package-review-block shared-information" aria-labelledby="shared-information-title">
          <p className="package-section-number" aria-hidden="true">04</p>
          <div>
            <h3 id="shared-information-title">Information included</h3>
            <dl>
              {preview.shared_information.map((item) => (
                <div key={item.field}>
                  <dt>{item.label}</dt>
                  <dd>{displaySharedValue(item.field, item.value, preview)}</dd>
                  <span>{sourceLabels[item.source]}</span>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="package-review-block confirmed-information" aria-labelledby="confirmed-information-title">
          <p className="package-section-number" aria-hidden="true">05</p>
          <div>
            <h3 id="confirmed-information-title">Human-confirmed information</h3>
            <p>
              Physical therapy from{" "}
              <strong>{formatIsoDate(preview.human_confirmed_information.treatment_start_date, true)}</strong>{" "}
              through{" "}
              <strong>{formatIsoDate(preview.human_confirmed_information.treatment_end_date, true)}</strong>.
            </p>
            <small>
              Confirmed by {preview.human_confirmed_information.confirmed_by} in
              the ASSERA interface on{" "}
              {formatIsoTimestamp(preview.human_confirmed_information.confirmed_at)}.
            </small>
          </div>
        </section>

        <section className="package-review-block approval-block" aria-labelledby="approval-status-title">
          <p className="package-section-number" aria-hidden="true">06</p>
          <div>
            <h3 id="approval-status-title">Approval status</h3>
            {isApproved ? (
              <div className="approved-state">
                <p className="approved-state-label">APPROVED LOCALLY — NOT SUBMITTED</p>
                <dl>
                  <div><dt>Approved by</dt><dd>{preview.approval.approved_by}</dd></div>
                  <div><dt>Approved at</dt><dd>{formatIsoTimestamp(preview.approval.approved_at)}</dd></div>
                  <div><dt>Package version</dt><dd>v{preview.draft_version}</dd></div>
                </dl>
                <p>
                  Maya approved this exact package version for a future simulated
                  submission. Nothing has been sent.
                </p>
                <div className="approved-actions">
                  <a href="#package-statement">Review approved package</a>
                  <button type="button" onClick={onRevoke}>Revoke approval</button>
                </div>
              </div>
            ) : (
              <fieldset className="approval-fieldset">
                <legend>Package approval</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    aria-describedby="approval-version-note approval-error"
                    onChange={(event) => {
                      setConfirmed(event.target.checked);
                      setError(null);
                    }}
                  />
                  <span>
                    I have reviewed the appeal statement, documents, and
                    information listed above. I approve this exact package for
                    simulated submission.
                  </span>
                </label>
                <p id="approval-version-note">
                  This approval applies only to the current package version.
                  Editing the draft will clear it.
                </p>
                <p id="approval-error" className={`form-message ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}>
                  {error ?? "Nothing will be submitted by this action."}
                </p>
                <button type="button" onClick={handleApprove}>Approve this package</button>
              </fieldset>
            )}
          </div>
        </section>
      </div>

      <div className="package-not-submitted">
        <strong>Nothing has been submitted.</strong>
        <span>No submission tool exists in this milestone.</span>
      </div>
    </section>
  );
}
