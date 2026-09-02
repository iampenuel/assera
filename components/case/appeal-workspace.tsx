"use client";

import { useState } from "react";
import { DraftStatementError } from "../../domain/appeal-draft";
import { formatIsoDate, formatIsoTimestamp } from "../../domain/format-date";
import type {
  AppealApproval,
  AppealDraft,
  AppealPackagePreview,
  AppealReadiness,
  AppealSubmission,
  EvidenceDocument,
  PrepareAppealResult,
  TreatmentDateConfirmation,
  SubmitAppealResult,
} from "../../types/case";
import { AppealPackageReview } from "./appeal-package-review";
import { SubmissionReceipt } from "./submission-receipt";
import { WorkflowContinuation } from "./workflow-continuation";

interface AppealWorkspaceProps {
  readonly draft: AppealDraft | null;
  readonly evidence: readonly EvidenceDocument[];
  readonly readiness: AppealReadiness;
  readonly confirmation: TreatmentDateConfirmation | null;
  readonly onPrepare: () => PrepareAppealResult;
  readonly onReviewPackage: () => void;
  readonly preview: AppealPackagePreview | null;
  readonly onSaveStatement: (statement: string) => AppealDraft;
  readonly onApprovePackage: (
    packageVersion: string,
    confirmation: boolean,
  ) => AppealApproval;
  readonly onRevokeApproval: () => boolean;
  readonly submission: AppealSubmission | null;
  readonly onSubmitSimulation: () => SubmitAppealResult;
  readonly onReviewReceipt: () => void;
}

export function AppealWorkspace({
  draft,
  evidence,
  readiness,
  confirmation,
  onPrepare,
  onReviewPackage,
  preview,
  onSaveStatement,
  onApprovePackage,
  onRevokeApproval,
  submission,
  onSubmitSimulation,
  onReviewReceipt,
}: AppealWorkspaceProps) {
  if (!draft) {
    return (
      <div id="appeal-workspace" className="appeal-workspace-anchor">
        {readiness.ready_to_prepare && confirmation ? (
          <WorkflowContinuation
            id="workflow-continuation-ready"
            state="ready-to-prepare"
            eyebrow="PREPARE"
            title="Ready to prepare locally"
            description="All five administrative requirements are complete. Preparing a draft creates it only in this temporary ASSERA workspace. Nothing is submitted."
            primaryLabel="Prepare appeal draft"
            statusLabel="NOT SUBMITTED"
            onPrimary={onPrepare}
          />
        ) : null}
      </div>
    );
  }

  return (
    <PreparedAppealWorkspace
      key={draft.id}
      draft={draft}
      evidence={evidence}
      preview={preview!}
      onSaveStatement={onSaveStatement}
      onReviewPackage={onReviewPackage}
      onApprovePackage={onApprovePackage}
      onRevokeApproval={onRevokeApproval}
      submission={submission}
      onSubmitSimulation={onSubmitSimulation}
      onReviewReceipt={onReviewReceipt}
    />
  );
}

function PreparedAppealWorkspace({
  draft,
  evidence,
  preview,
  onSaveStatement,
  onReviewPackage,
  onApprovePackage,
  onRevokeApproval,
  submission,
  onSubmitSimulation,
  onReviewReceipt,
}: Pick<
  AppealWorkspaceProps,
  "evidence" | "preview" | "onSaveStatement" | "onReviewPackage" | "onApprovePackage" | "onRevokeApproval" | "submission" | "onSubmitSimulation" | "onReviewReceipt"
> & {
  readonly draft: AppealDraft;
}) {
  const [statement, setStatement] = useState(draft.statement);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDirty = statement !== draft.statement;

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
    {submission ? null : (
      <WorkflowContinuation
        id="workflow-continuation-draft"
        state="draft-prepared"
        eyebrow="PREPARE COMPLETE"
        title="Appeal draft prepared"
        description={`Draft v${draft.version} is stored locally and remains unsubmitted. Review the exact package before Maya decides whether to approve it.`}
        primaryLabel="Review appeal package"
        statusLabel="NOT SUBMITTED"
        onPrimary={onReviewPackage}
      />
    )}
    <section
      id="appeal-workspace"
      className="appeal-workspace"
      tabIndex={-1}
      aria-labelledby="appeal-workspace-title"
      aria-live="polite"
    >
      <div className="appeal-workspace-heading">
        <div>
          <p className="draft-eyebrow">
            {submission ? "SIMULATED SUBMISSION RECORDED" : "DRAFT — NOT SUBMITTED"}
          </p>
          <h2 id="appeal-workspace-title">
            {submission ? "Submitted package source" : "Appeal draft"}
          </h2>
        </div>
        <span className="draft-safety-label">
          {submission ? "FINALIZED" : "LOCAL WORKSPACE"}
        </span>
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
        readOnly={submission !== null}
        maxLength={5_000}
        aria-describedby="draft-edit-status draft-safety-copy"
        onChange={(event) => {
          if (submission) return;
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
        {submission ? (
          <span className="finalized-field-label">READ-ONLY AFTER SIMULATION</span>
        ) : isDirty ? (
          <button type="button" onClick={handleSave}>Save changes</button>
        ) : (
          <span className="draft-saved-state">Current version saved</span>
        )}
      </div>

      <div id="draft-safety-copy" className="appeal-workspace-safety">
        <strong>
          {submission
            ? "The package is locked to the immutable simulated receipt."
            : "Nothing has been sent to Northstar Health."}
        </strong>
        <span>
          {submission
            ? "No real insurer was contacted and no external network request occurred."
            : "Synthetic demonstration case. This draft does not provide medical or legal advice."}
        </span>
      </div>
    </section>
    {preview ? (
      <AppealPackageReview
        key={preview.package_version}
        preview={preview}
        onApprove={onApprovePackage}
        onRevoke={onRevokeApproval}
        onSubmit={onSubmitSimulation}
        onReviewPackage={onReviewPackage}
      />
    ) : null}
    {submission ? (
      <>
        <WorkflowContinuation
          id="workflow-continuation-receipt"
          state="receipt-recorded"
          eyebrow="ACT · SIMULATION COMPLETE"
          title="Receipt recorded"
          description="No real insurer was contacted. The exact approved package is finalized with one immutable simulated receipt."
          primaryLabel="Review receipt"
          statusLabel="SIMULATION ONLY"
          onPrimary={onReviewReceipt}
        />
        <SubmissionReceipt submission={submission} />
      </>
    ) : null}
    </>
  );
}
