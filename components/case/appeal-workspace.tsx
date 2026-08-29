"use client";

import { useState } from "react";
import { DraftStatementError } from "../../domain/appeal-draft";
import { formatIsoDate, formatIsoTimestamp } from "../../domain/format-date";
import type {
  AppealApproval,
  AppealDraft,
  AppealPackagePreview,
  AppealReadiness,
  EvidenceDocument,
  TreatmentDateConfirmation,
} from "../../types/case";
import { AppealPackageReview } from "./appeal-package-review";

interface AppealWorkspaceProps {
  readonly draft: AppealDraft | null;
  readonly evidence: readonly EvidenceDocument[];
  readonly readiness: AppealReadiness;
  readonly confirmation: TreatmentDateConfirmation | null;
  readonly preview: AppealPackagePreview | null;
  readonly onSaveStatement: (statement: string) => AppealDraft;
  readonly onApprovePackage: (
    packageVersion: string,
    confirmation: boolean,
  ) => AppealApproval;
  readonly onRevokeApproval: () => boolean;
}

export function AppealWorkspace({
  draft,
  evidence,
  readiness,
  confirmation,
  preview,
  onSaveStatement,
  onApprovePackage,
  onRevokeApproval,
}: AppealWorkspaceProps) {
  if (!draft) {
    return (
      <section
        id="appeal-workspace"
        className={readiness.ready_to_prepare ? "appeal-workspace-ready" : "appeal-workspace-anchor"}
        tabIndex={-1}
        aria-live="polite"
        aria-label="Appeal draft workspace"
      >
        {readiness.ready_to_prepare && confirmation ? (
          <>
            <div>
              <p className="case-section-label">PREPARE</p>
              <h2>Ready to prepare locally</h2>
              <p>
                All five administrative requirements are complete. Preparing a
                draft will create it only in this temporary ASSERA workspace.
              </p>
            </div>
            <span className="draft-safety-label">NOT SUBMITTED</span>
          </>
        ) : null}
      </section>
    );
  }

  return (
    <PreparedAppealWorkspace
      key={draft.id}
      draft={draft}
      evidence={evidence}
      preview={preview!}
      onSaveStatement={onSaveStatement}
      onApprovePackage={onApprovePackage}
      onRevokeApproval={onRevokeApproval}
    />
  );
}

function PreparedAppealWorkspace({
  draft,
  evidence,
  preview,
  onSaveStatement,
  onApprovePackage,
  onRevokeApproval,
}: Pick<
  AppealWorkspaceProps,
  "evidence" | "preview" | "onSaveStatement" | "onApprovePackage" | "onRevokeApproval"
> & {
  readonly draft: AppealDraft;
}) {
  const [statement, setStatement] = useState(draft.statement);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const includedDocuments = draft.evidence_ids
    .map((id) => evidence.find((document) => document.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const handleSave = () => {
    setError(null);
    setMessage(null);
    try {
      const previousVersion = draft.version;
      const hadApproval = preview?.approval.status === "approved";
      const updated = onSaveStatement(statement);
      setStatement(updated.statement);
      setMessage(
        updated.version === previousVersion
          ? "No content changes to save. The current package version and approval remain unchanged."
          : hadApproval
            ? "Changes saved locally. Previous package approval cleared. Nothing submitted."
            : "Changes saved locally. Nothing was submitted.",
      );
    } catch (caught) {
      setError(
        caught instanceof DraftStatementError
          ? caught.message
          : "The draft could not be saved. Review the statement and try again.",
      );
    }
  };

  return (
    <>
    <section
      id="appeal-workspace"
      className="appeal-workspace"
      tabIndex={-1}
      aria-labelledby="appeal-workspace-title"
      aria-live="polite"
    >
      <div className="appeal-workspace-heading">
        <div>
          <p className="draft-eyebrow">DRAFT — NOT SUBMITTED</p>
          <h2 id="appeal-workspace-title">Appeal draft</h2>
        </div>
        <span className="draft-safety-label">LOCAL WORKSPACE</span>
      </div>

      <dl className="draft-metadata">
        <div><dt>Case</dt><dd>{draft.case_id}</dd></div>
        <div><dt>Draft version</dt><dd>v{draft.version}</dd></div>
        <div><dt>Destination</dt><dd>Northstar Health Appeals Department</dd></div>
        <div><dt>Created</dt><dd>{formatIsoTimestamp(draft.created_at)}</dd></div>
        <div>
          <dt>Readiness at preparation</dt>
          <dd>{draft.requirement_summary.complete} of {draft.requirement_summary.total} complete</dd>
        </div>
        <div className="draft-metadata-wide">
          <dt>Human-confirmed information</dt>
          <dd>
            Physical therapy from {formatIsoDate(draft.treatment_date_confirmation.start_date, true)} to{" "}
            {formatIsoDate(draft.treatment_date_confirmation.end_date, true)}
          </dd>
        </div>
        <div className="draft-metadata-wide">
          <dt>Prepared from</dt>
          <dd>{includedDocuments.join(", ")}</dd>
        </div>
      </dl>

      <label className="draft-statement-label" htmlFor="appeal-draft-statement">
        Draft statement
      </label>
      <textarea
        id="appeal-draft-statement"
        value={statement}
        maxLength={5_000}
        aria-describedby="draft-edit-status draft-safety-copy"
        onChange={(event) => {
          setStatement(event.target.value);
          setMessage(null);
          setError(null);
        }}
      />
      <div className="draft-edit-row">
        <p
          id="draft-edit-status"
          className={`form-message ${error ? "is-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error ?? message ?? `${statement.length.toLocaleString("en-US")} / 5,000 characters`}
        </p>
        <button type="button" onClick={handleSave}>Save changes</button>
      </div>

      <div id="draft-safety-copy" className="appeal-workspace-safety">
        <strong>Nothing has been sent to Northstar Health.</strong>
        <span>
          Synthetic demonstration case. This draft does not provide medical or
          legal advice.
        </span>
      </div>
    </section>
    {preview ? (
      <AppealPackageReview
        key={preview.package_version}
        preview={preview}
        onApprove={onApprovePackage}
        onRevoke={onRevokeApproval}
      />
    ) : null}
    </>
  );
}
