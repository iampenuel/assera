import { mayaCase } from "../../data/case-fixture";

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
          Requested on {mayaCase.requested_date}
        </p>
      </div>
      <div className="deadline-panel">
        <span className="deadline-icon" aria-hidden="true">29</span>
        <div>
          <p>APPEAL DEADLINE</p>
          <strong>October 29, 2026</strong>
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
        <p>We found records showing 7 weeks of physical therapy. Please confirm the start and end dates.</p>
      </div>
      <button type="button" onClick={onReviewDates}>Review dates <span aria-hidden="true">→</span></button>
    </section>
  );
}
