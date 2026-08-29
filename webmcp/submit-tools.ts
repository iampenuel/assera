import type {
  CaseWorkspaceToolAdapter,
  SubmitAppealInput,
  SubmitAppealToolResult,
} from "../types/case";
import { CaseToolError } from "./case-tool-helpers";

export const SUBMIT_APPEAL_TOOL_NAME = "submit_appeal";

export function createSubmitAppealInputSchema(caseId: string) {
  return {
    type: "object",
    properties: {
      case_id: {
        type: "string",
        const: caseId,
        description: "The current ASSERA case identifier.",
      },
      package_id: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "The current package identifier returned by preview_appeal.",
      },
      package_version: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "The exact approved package version returned by preview_appeal.",
      },
      approval_id: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "The matching human approval identifier returned by preview_appeal.",
      },
      mode: {
        type: "string",
        const: "simulation",
        description: "Confirms that ASSERA should record a synthetic simulated submission.",
      },
    },
    required: [
      "case_id",
      "package_id",
      "package_version",
      "approval_id",
      "mode",
    ],
    additionalProperties: false,
  } as const;
}

function parseSubmitAppealInput(
  input: unknown,
  currentCaseId: string,
): SubmitAppealInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new CaseToolError("INVALID_INPUT", "Valid submission references are required.");
  }

  const allowedKeys = [
    "approval_id",
    "case_id",
    "mode",
    "package_id",
    "package_version",
  ];
  const keys = Object.keys(input).sort();
  const candidate = input as Record<string, unknown>;
  const validReference = (value: unknown) =>
    typeof value === "string" && value.length >= 1 && value.length <= 200;

  if (
    keys.length !== allowedKeys.length ||
    keys.some((key, index) => key !== allowedKeys[index]) ||
    !validReference(candidate.case_id) ||
    !validReference(candidate.package_id) ||
    !validReference(candidate.package_version) ||
    !validReference(candidate.approval_id) ||
    candidate.mode !== "simulation"
  ) {
    throw new CaseToolError("INVALID_INPUT", "Valid submission references are required.");
  }

  if (candidate.case_id !== currentCaseId) {
    throw new CaseToolError(
      "CASE_NOT_FOUND",
      `No ASSERA case was found for case_id “${candidate.case_id}”.`,
    );
  }

  return candidate as unknown as SubmitAppealInput;
}

export function submitAppeal(
  input: unknown,
  adapter: CaseWorkspaceToolAdapter,
  signal?: AbortSignal,
): SubmitAppealToolResult {
  const validatedInput = parseSubmitAppealInput(
    input,
    adapter.getSnapshot().caseId,
  );
  const result = adapter.submitAppeal(validatedInput, signal);
  const submission = result.submission;

  return {
    action: result.action,
    case_id: submission.case_id,
    package_id: submission.package_id,
    package_version: submission.package_version,
    approval_id: submission.approval_id,
    submission: {
      id: submission.id,
      case_id: submission.case_id,
      status: submission.status,
      submitted_at: submission.submitted_at,
      submitted_by: submission.submitted_by,
      destination: submission.destination,
      receipt: submission.receipt,
      confirmation_number: submission.receipt.confirmation_number,
      synthetic: submission.synthetic,
      external_network_request: submission.external_network_request,
    },
  };
}
