"use client";

import { useState, type FormEvent } from "react";
import { formatIsoDate } from "../../domain/format-date";
import { TreatmentDateValidationError } from "../../domain/treatment-dates";
import type {
  ConfirmTreatmentDatesInput,
  ConfirmTreatmentDatesResult,
  TreatmentDateConfirmation,
} from "../../types/case";

interface TreatmentDatePanelProps {
  readonly confirmation: TreatmentDateConfirmation | null;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onCancel: () => void;
  readonly onConfirm: (
    input: ConfirmTreatmentDatesInput,
  ) => ConfirmTreatmentDatesResult;
}

const DEMO_TREATMENT_START_DATE = "2026-07-01";
const DEMO_TREATMENT_END_DATE = "2026-08-19";

export function TreatmentDatePanel({
  confirmation,
  open,
  onOpen,
  onCancel,
  onConfirm,
}: TreatmentDatePanelProps) {
  if (!open) {
    return (
      <section
        id="treatment-dates"
        className={`treatment-date-panel ${confirmation ? "is-confirmed" : "is-compact"}`}
        tabIndex={-1}
        aria-labelledby="treatment-dates-title"
        aria-live="polite"
      >
        <div>
          <p className="case-section-label">
            {confirmation ? "HUMAN-CONFIRMED INFORMATION" : "INFORMATION NEEDED"}
          </p>
          <h2 id="treatment-dates-title">
            {confirmation
              ? "Physical-therapy dates confirmed"
              : "Treatment dates need confirmation"}
          </h2>
          {confirmation ? (
            <p>
              Maya Thompson confirmed physical therapy from{" "}
              <strong>{formatIsoDate(confirmation.start_date, true)}</strong> to{" "}
              <strong>{formatIsoDate(confirmation.end_date, true)}</strong>. This
              information came through the ASSERA interface and was not supplied
              by the insurer.
            </p>
          ) : (
            <p>
              Confirm the physical-therapy start and end dates to finish the
              administrative readiness check.
            </p>
          )}
        </div>
        <button type="button" onClick={onOpen}>
          {confirmation ? "Edit confirmed dates" : "Confirm dates"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </section>
    );
  }

  return (
    <TreatmentDateForm
      key={`${confirmation?.start_date ?? "new"}-${confirmation?.end_date ?? "new"}`}
      confirmation={confirmation}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function TreatmentDateForm({
  confirmation,
  onCancel,
  onConfirm,
}: Omit<TreatmentDatePanelProps, "open" | "onOpen">) {
  const [startDate, setStartDate] = useState(
    confirmation?.start_date ?? DEMO_TREATMENT_START_DATE,
  );
  const [endDate, setEndDate] = useState(
    confirmation?.end_date ?? DEMO_TREATMENT_END_DATE,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      onConfirm({
        start_date: startDate,
        end_date: endDate,
        confirmation: confirmed,
      });
    } catch (caught) {
      setError(
        caught instanceof TreatmentDateValidationError
          ? caught.message
          : "The dates could not be confirmed. Review the information and try again.",
      );
    }
  };

  const errorId = "treatment-date-error";

  return (
    <section
      id="treatment-dates"
      className="treatment-date-panel is-editing"
      tabIndex={-1}
      aria-labelledby="treatment-form-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <p className="case-section-label">HUMAN CONFIRMATION</p>
        <h2 id="treatment-form-title">Confirm physical-therapy dates</h2>
        <p className="treatment-form-intro">
          Confirm the start and end dates shown in your records. ASSERA will use
          them to update administrative readiness. Nothing will be sent to
          Northstar Health.
        </p>

        <fieldset>
          <legend className="sr-only">Physical-therapy treatment dates</legend>
          <div className="treatment-date-fields">
            <label>
              <span>Treatment start date</span>
              <input
                id="treatment-start-date"
                type="date"
                value={startDate}
                max="2026-08-20"
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>
              <span>Treatment end date</span>
              <input
                id="treatment-end-date"
                type="date"
                value={endDate}
                max="2026-08-20"
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
          <label className="confirmation-check">
            <input
              type="checkbox"
              checked={confirmed}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>I confirm these dates are accurate to the best of my knowledge.</span>
          </label>
        </fieldset>

        <p
          id={errorId}
          className={`form-message ${error ? "is-error" : ""}`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {error ?? "Dates are not added to the workspace until you confirm them."}
        </p>

        <div className="form-actions">
          <button className="primary" type="submit">Confirm dates</button>
          <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
