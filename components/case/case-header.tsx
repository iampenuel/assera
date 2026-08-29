import { mayaCase } from "../../data/case-fixture";
import { mayaEvidence } from "../../data/evidence-fixture";
import { formatIsoDate } from "../../domain/format-date";

const physicalTherapyEvidence = mayaEvidence.find(
  (document) => document.id === "evidence-physical-therapy",
);

export function CaseHeader() {
  return (
    <section id="overview" className="case-overview" aria-labelledby="case-title">
      <div className="case-identity">
        <div className="case-status-line">
          <span className="denied-badge">DENIED</span>
          <span>Case {mayaCase.case_id}</span>
        </div>
        <h1 id="case-title">{mayaCase.service}</h1>
        <p className="case-payer">{mayaCase.payer}</p>
        <p className="request-meta">
          Requested by {mayaCase.requested_by} <span aria-hidden="true">•</span>{" "}
          Requested on {formatIsoDate(mayaCase.requested_date, true)}
        </p>
      </div>
      <div className="deadline-panel">
        <span className="deadline-icon" aria-hidden="true">29</span>
        <div>
          <p>APPEAL DEADLINE</p>
          <strong>{formatIsoDate(mayaCase.appeal_deadline, true)}</strong>
          <span>{mayaCase.days_remaining} days remaining</span>
          <small>Review before this date.</small>
        </div>
      </div>
    </section>
  );
}

export function AttentionStrip({ onReviewDates }: { onReviewDates: () => void }) {
  return (
    <section className="attention-strip" aria-labelledby="attention-title">
      <span className="attention-symbol" aria-hidden="true">!</span>
      <div>
        <h2 id="attention-title">One item needs your confirmation</h2>
        <p>
          We found records showing {physicalTherapyEvidence?.facts?.conservative_treatment_weeks ?? 7} weeks of
          physical therapy. Please confirm the start and end dates.
        </p>
      </div>
      <button type="button" onClick={onReviewDates}>Review dates <span aria-hidden="true">→</span></button>
    </section>
  );
}
