import { mayaCase } from "../data/case-fixture";

export interface CaseToolInput {
  case_id: string;
}

export type CaseToolErrorCode = "INVALID_INPUT" | "CASE_NOT_FOUND";

export class CaseToolError extends Error {
  readonly code: CaseToolErrorCode;

  constructor(code: CaseToolErrorCode, message: string) {
    super(message);
    this.name = "CaseToolError";
    this.code = code;
  }
}

export const caseToolInputSchema = {
  type: "object",
  properties: {
    case_id: {
      type: "string",
      const: mayaCase.case_id,
      description: "The ASSERA prior-authorization case identifier.",
    },
  },
  required: ["case_id"],
  additionalProperties: false,
} as const;

export const readOnlyToolAnnotations = {
  readOnlyHint: true,
  untrustedContentHint: false,
} as const;

export function requireKnownCase(input: unknown): typeof mayaCase {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new CaseToolError("INVALID_INPUT", "A valid case_id is required.");
  }

  const keys = Object.keys(input);
  if (
    keys.length !== 1 ||
    keys[0] !== "case_id" ||
    !("case_id" in input) ||
    typeof input.case_id !== "string" ||
    input.case_id.trim() === ""
  ) {
    throw new CaseToolError("INVALID_INPUT", "A valid case_id is required.");
  }

  if (input.case_id !== mayaCase.case_id) {
    throw new CaseToolError(
      "CASE_NOT_FOUND",
      `No ASSERA case was found for case_id “${input.case_id}”.`,
    );
  }

  return mayaCase;
}
