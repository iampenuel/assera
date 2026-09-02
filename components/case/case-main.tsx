import { formatIsoDate } from "../../domain/format-date";
import { buildAppealPackagePreview } from "../../domain/appeal-package";
import type {
  AppealApproval,
  AppealDraft,
  PrepareAppealResult,
  SubmitAppealResult,
  CaseWorkspaceSnapshot,
  ConfirmTreatmentDatesInput,
  ConfirmTreatmentDatesResult,
  EvidenceDocument,
  EvidenceStatus,
} from "../../types/case";
import { AppealWorkspace } from "./appeal-workspace";
import { AttentionStrip, CaseHeader } from "./case-header";
import { TreatmentDatePanel } from "./treatment-date-form";

const evidenceStatusCopy: Record<
  EvidenceStatus,
  { label: string; symbol: string; className: string }
> = {
  verified: { label: "Verified", symbol: "✓", className: "verified" },
  needs_confirmation: {
    label: "Needs confirmation",
    symbol: "•",
    className: "needs-confirmation",
  },
  human_confirmed: {
    label: "Human confirmed",
    symbol: "✓",
    className: "human-confirmed",
  },
  insurer_source: {
    label: "Insurer source",
    symbol: "i",
    className: "insurer-source",
  },
};

function DenialExplanation({ snapshot }: { snapshot: CaseWorkspaceSnapshot }) {
  const caseData = snapshot.caseData;

  return (
    <section className="case-surface denial-explanation" aria-labelledby="denial-title">
      <p className="case-section-label">WHAT THE INSURER SAID — AND WHAT IT MEANS</p>
      <h2 id="denial-title" className="sr-only">Denial explanation</h2>
      <div className="explanation-halves">
        <article className="insurer-half">
          <p className="source-heading">INSURER LANGUAGE (ORIGINAL)</p>
          <blockquote>“{caseData.reason}”</blockquote>
          <dl className="source-meta">
            <div><dt>Reason code</dt><dd>{caseData.reason_code}</dd></div>
            <div><dt>Source</dt><dd>Insurer denial</dd></div>
          </dl>
        </article>
        <article className="explanation-half">
          <p className="source-heading">EXPLANATION IN PLAIN LANGUAGE</p>
          <p className="plain-explanation">{caseData.plain_language_explanation}</p>
          <dl className="source-meta">
            <div><dt>Source</dt><dd>ASSERA explanation</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}

function EvidenceList({ evidence }: { evidence: readonly EvidenceDocument[] }) {
  return (
    <section id="evidence" className="evidence-panel" aria-labelledby="evidence-title">
      <div className="panel-heading">
        <div>
          <p className="case-section-label">AVAILABLE EVIDENCE</p>
          <h2 id="evidence-title">{evidence.length} documents</h2>
        </div>
      </div>
      <table>
        <thead><tr><th>Document</th><th>Source</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {evidence.map((document) => {
            const status = evidenceStatusCopy[document.status];
            return (
              <tr key={document.id}>
                <th scope="row" data-label="Document">{document.name}</th>
                <td data-label="Source">{document.source}</td>
                <td data-label="Date">{formatIsoDate(document.document_date)}</td>
                <td data-label="Status">
                  <span className={`evidence-status ${status.className}`}>
                    <span aria-hidden="true">{status.symbol}</span>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function ReadinessPanel({ snapshot }: { snapshot: CaseWorkspaceSnapshot }) {
  const { readiness, policy } = snapshot;

  return (
    <section id="requirements" className="readiness-panel" aria-labelledby="readiness-title" aria-live="polite">
      <div className="panel-heading">
        <div>
          <p className="case-section-label">APPEAL READINESS</p>
          <h2 id="readiness-title">
            {readiness.summary.complete} of {readiness.summary.total} requirements complete
          </h2>
        </div>
      </div>
      <ol className="requirements-list">
        {readiness.requirements.map((requirement) => {
          const policyRequirement = policy.requirements.find(
            (candidate) => candidate.id === requirement.requirement_id,
          );
          const isComplete = requirement.status === "complete";

          return (
            <li
              className={isComplete ? "is-complete" : "is-missing"}
              key={requirement.requirement_id}
            >
              <span aria-hidden="true">{isComplete ? "✓" : "○"}</span>
              <span>
                {requirement.requirement_id === "treatment_date_range" && isComplete
                  ? "Treatment dates confirmed"
                  : policyRequirement?.workspace_label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="requirements-note">
        Administrative requirements from a fictional Northstar Health policy used for this synthetic demonstration.
      </p>
    </section>
  );
}

interface CaseMainProps {
  readonly snapshot: CaseWorkspaceSnapshot;
  readonly dateFormOpen: boolean;
  readonly onReviewDates: () => void;
  readonly onCancelDates: () => void;
  readonly onConfirmDates: (
    input: ConfirmTreatmentDatesInput,
  ) => ConfirmTreatmentDatesResult;
  readonly onPrepare: () => PrepareAppealResult;
  readonly onSaveDraft: (statement: string) => AppealDraft;
  readonly onApprovePackage: (
    packageVersion: string,
    confirmation: boolean,
  ) => AppealApproval;
  readonly onRevokeApproval: () => boolean;
  readonly onSubmitSimulation: () => SubmitAppealResult;
}

export function CaseMain({
  snapshot,
  dateFormOpen,
  onReviewDates,
  onCancelDates,
  onConfirmDates,
  onPrepare,
  onSaveDraft,
  onApprovePackage,
  onRevokeApproval,
  onSubmitSimulation,
}: CaseMainProps) {
  const physicalTherapyEvidence = snapshot.effectiveEvidence.find(
    (document) => document.id === "evidence-physical-therapy",
  );
  const packagePreview = snapshot.appealDraft
    ? buildAppealPackagePreview(snapshot)
    : null;

  return (
    <div className="case-main-column">
      <CaseHeader caseData={snapshot.caseData} />
      {!snapshot.treatmentDateConfirmation ? (
        <AttentionStrip
          physicalTherapyEvidence={physicalTherapyEvidence}
          onReviewDates={onReviewDates}
        />
      ) : null}
      <DenialExplanation snapshot={snapshot} />
      <div className="evidence-readiness-surface">
        <EvidenceList evidence={snapshot.effectiveEvidence} />
        <ReadinessPanel snapshot={snapshot} />
      </div>
      <TreatmentDatePanel
        confirmation={snapshot.treatmentDateConfirmation}
        open={dateFormOpen}
        locked={snapshot.appealSubmission !== null}
        onOpen={onReviewDates}
        onCancel={onCancelDates}
        onConfirm={onConfirmDates}
      />
      <AppealWorkspace
        draft={snapshot.appealDraft}
        evidence={snapshot.effectiveEvidence}
        readiness={snapshot.readiness}
        confirmation={snapshot.treatmentDateConfirmation}
        onPrepare={onPrepare}
        preview={packagePreview}
        onSaveStatement={onSaveDraft}
        onApprovePackage={onApprovePackage}
        onRevokeApproval={onRevokeApproval}
        submission={snapshot.appealSubmission}
        onSubmitSimulation={onSubmitSimulation}
      />
      <p className="case-disclaimer">
        ASSERA is a demonstration of healthcare access navigation. It does not provide medical or legal advice.
      </p>
    </div>
  );
}
