import { mayaCase } from "../../data/case-fixture";
import { mayaEvidence } from "../../data/evidence-fixture";
import { mayaCoveragePolicy } from "../../data/policy-fixture";
import { formatIsoDate } from "../../domain/format-date";
import { evaluateAppealReadiness } from "../../domain/readiness";
import type { EvidenceStatus } from "../../types/case";
import { AttentionStrip, CaseHeader } from "./case-header";

const readiness = evaluateAppealReadiness(
  mayaCase.case_id,
  mayaCoveragePolicy,
  mayaEvidence,
);

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
  insurer_source: {
    label: "Insurer source",
    symbol: "i",
    className: "insurer-source",
  },
};

function DenialExplanation() {
  return (
    <section className="case-surface denial-explanation" aria-labelledby="denial-title">
      <p className="case-section-label">WHAT THE INSURER SAID — AND WHAT IT MEANS</p>
      <h2 id="denial-title" className="sr-only">Denial explanation</h2>
      <div className="explanation-halves">
        <article className="insurer-half">
          <p className="source-heading">INSURER LANGUAGE (ORIGINAL)</p>
          <blockquote>“{mayaCase.reason}”</blockquote>
          <dl className="source-meta">
            <div><dt>Reason code</dt><dd>{mayaCase.reason_code}</dd></div>
            <div><dt>Source</dt><dd>Insurer denial</dd></div>
          </dl>
        </article>
        <article className="explanation-half">
          <p className="source-heading">EXPLANATION IN PLAIN LANGUAGE</p>
          <p className="plain-explanation">{mayaCase.plain_language_explanation}</p>
          <dl className="source-meta">
            <div><dt>Source</dt><dd>ASSERA explanation</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}

function EvidenceList() {
  return (
    <section id="evidence" className="evidence-panel" aria-labelledby="evidence-title">
      <div className="panel-heading">
        <div>
          <p className="case-section-label">AVAILABLE EVIDENCE</p>
          <h2 id="evidence-title">{mayaEvidence.length} documents</h2>
        </div>
      </div>
      <table>
        <thead><tr><th>Document</th><th>Source</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {mayaEvidence.map((document) => {
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

function ReadinessPanel() {
  return (
    <section id="requirements" className="readiness-panel" aria-labelledby="readiness-title">
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
          const policyRequirement = mayaCoveragePolicy.requirements.find(
            (candidate) => candidate.id === requirement.requirement_id,
          );
          const isComplete = requirement.status === "complete";

          return (
            <li
              id={requirement.requirement_id === "treatment_date_range" ? "treatment-dates" : undefined}
              className={isComplete ? "is-complete" : "is-missing"}
              key={requirement.requirement_id}
              tabIndex={isComplete ? undefined : -1}
            >
              <span aria-hidden="true">{isComplete ? "✓" : "○"}</span>
              <span>{policyRequirement?.workspace_label}</span>
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

export function CaseMain({ onReviewDates }: { onReviewDates: () => void }) {
  return (
    <div className="case-main-column">
      <CaseHeader />
      <AttentionStrip onReviewDates={onReviewDates} />
      <DenialExplanation />
      <div className="evidence-readiness-surface">
        <EvidenceList />
        <ReadinessPanel />
      </div>
      <p className="case-disclaimer">
        ASSERA is a demonstration of healthcare access navigation. It does not provide medical or legal advice.
      </p>
    </div>
  );
}
