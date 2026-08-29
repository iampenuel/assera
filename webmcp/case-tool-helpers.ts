import { SUPPORTED_CASE_ID } from "../data/case-fixture";

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

export function createCaseToolInputSchema(caseId: string) {
  return {
    type: "object",
    properties: {
      case_id: {
        type: "string",
        const: caseId,
        description: "The ASSERA prior-authorization case identifier.",
      },
    },
    required: ["case_id"],
    additionalProperties: false,
  } as const;
}

export const caseToolInputSchema = createCaseToolInputSchema(SUPPORTED_CASE_ID);

export const readOnlyToolAnnotations = {
  readOnlyHint: true,
  untrustedContentHint: false,
} as const;

export function requireKnownCase(
  input: unknown,
  currentCaseId = SUPPORTED_CASE_ID,
): CaseToolInput {
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

  if (input.case_id !== currentCaseId) {
    throw new CaseToolError(
      "CASE_NOT_FOUND",
      `No ASSERA case was found for case_id “${input.case_id}”.`,
    );
  }

  return { case_id: input.case_id };
}
