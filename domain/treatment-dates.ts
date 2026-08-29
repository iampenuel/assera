import type {
  ConfirmTreatmentDatesInput,
  EvidenceDocument,
  TreatmentDateConfirmation,
} from "../types/case";

export type TreatmentDateErrorCode =
  | "INVALID_DATE"
  | "DATE_ORDER_INVALID"
  | "DATE_AFTER_RECORD"
  | "TREATMENT_RANGE_TOO_SHORT"
  | "CONFIRMATION_REQUIRED";

export class TreatmentDateValidationError extends Error {
  readonly code: TreatmentDateErrorCode;

  constructor(code: TreatmentDateErrorCode, message: string) {
    super(message);
    this.name = "TreatmentDateValidationError";
    this.code = code;
  }
}

interface ValidatedTreatmentDates {
  readonly start_date: string;
  readonly end_date: string;
  readonly duration_days: number;
}

const DAY_IN_MS = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoCalendarDate(value: string): number | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

export function validateTreatmentDates(
  input: ConfirmTreatmentDatesInput,
  recordDate: string,
): ValidatedTreatmentDates {
  const startTimestamp = parseIsoCalendarDate(input.start_date);
  const endTimestamp = parseIsoCalendarDate(input.end_date);
  const recordTimestamp = parseIsoCalendarDate(recordDate);

  if (
    startTimestamp === null ||
    endTimestamp === null ||
    recordTimestamp === null
  ) {
    throw new TreatmentDateValidationError(
      "INVALID_DATE",
      "Enter valid treatment start and end dates.",
    );
  }

  if (startTimestamp > endTimestamp) {
    throw new TreatmentDateValidationError(
      "DATE_ORDER_INVALID",
      "The treatment start date must be on or before the end date.",
    );
  }

  if (endTimestamp > recordTimestamp) {
    throw new TreatmentDateValidationError(
      "DATE_AFTER_RECORD",
      "The treatment end date cannot be later than the physical-therapy summary dated August 20, 2026.",
    );
  }

  const durationDays = Math.floor((endTimestamp - startTimestamp) / DAY_IN_MS);
  if (durationDays < 42) {
    throw new TreatmentDateValidationError(
      "TREATMENT_RANGE_TOO_SHORT",
      "This date range does not establish six weeks of treatment. Review the dates before confirming.",
    );
  }

  if (!input.confirmation) {
    throw new TreatmentDateValidationError(
      "CONFIRMATION_REQUIRED",
      "Confirm that the dates are accurate before updating the case workspace.",
    );
  }

  return {
    start_date: input.start_date,
    end_date: input.end_date,
    duration_days: durationDays,
  };
}

export function createTreatmentDateConfirmation(
  dates: ValidatedTreatmentDates,
  confirmedAt: string,
): TreatmentDateConfirmation {
  return {
    ...dates,
    confirmed_at: confirmedAt,
    confirmed_by: {
      type: "patient",
      name: "Maya Thompson",
    },
    provided_via: "ASSERA_UI",
    source_evidence_id: "evidence-physical-therapy",
  };
}

export function deriveEffectiveEvidence(
  baseEvidence: readonly EvidenceDocument[],
  treatmentDateConfirmation: TreatmentDateConfirmation | null,
): readonly EvidenceDocument[] {
  if (!treatmentDateConfirmation) return baseEvidence;

  return baseEvidence.map((document) => {
    if (document.id !== treatmentDateConfirmation.source_evidence_id) {
      return document;
    }

    const supports = document.supports.includes("treatment_date_range")
      ? document.supports
      : [...document.supports, "treatment_date_range" as const];

    return {
      ...document,
      status: "human_confirmed" as const,
      supports,
      needs_confirmation: document.needs_confirmation.filter(
        (gap) => gap.requirement_id !== "treatment_date_range",
      ),
      human_confirmation: treatmentDateConfirmation,
      facts: {
        ...document.facts,
        explicit_date_range_confirmed: true,
      },
    };
  });
}
