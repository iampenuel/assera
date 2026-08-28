import { mayaCase } from "../../data/case-fixture";
import { AttentionStrip, CaseHeader } from "./case-header";

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
        <div><p className="case-section-label">EVIDENCE WE HAVE</p><h2 id="evidence-title">4 documents</h2></div>
      </div>
      <table>
        <thead><tr><th>Document</th><th>Source</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {mayaCase.evidence.map((document) => (
            <tr key={document.id}>
              <th scope="row" data-label="Document">{document.title}</th>
              <td data-label="Source">{document.source}</td>
              <td data-label="Date">{document.date}</td>
              <td data-label="Status">
                <span className={`evidence-status ${document.status.toLowerCase().replace(" ", "-")}`}>
                  <span aria-hidden="true">{document.status === "Verified" ? "✓" : document.status === "Dates incomplete" ? "•" : "i"}</span>
                  {document.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReadinessPanel() {
  return (
    <section id="requirements" className="readiness-panel" aria-labelledby="readiness-title">
      <div className="panel-heading">
        <div><p className="case-section-label">APPEAL READINESS</p><h2 id="readiness-title">4 of 5 requirements complete</h2></div>
      </div>
      <ol className="requirements-list">
        {mayaCase.readiness.map((requirement) => (
          <li
            id={requirement.id === "treatment-dates" ? "treatment-dates" : undefined}
            className={requirement.complete ? "is-complete" : "is-missing"}
            key={requirement.id}
            tabIndex={requirement.complete ? undefined : -1}
          >
            <span aria-hidden="true">{requirement.complete ? "✓" : "○"}</span>
            <span>{requirement.label}</span>
          </li>
        ))}
      </ol>
      <p className="requirements-note">Requirements based on payer policy and plan rules.</p>
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
