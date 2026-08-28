import { mayaCase } from "../data/case-fixture";
import type { DenialDetails, WebMCPStatus } from "../types/case";

export const DENIAL_DETAILS_TOOL_NAME = "get_denial_details";

export interface DenialDetailsToolInput {
  case_id: string;
}

interface RegistrationOptions {
  onAccess: (occurredAt: string) => void;
  onStatusChange: (status: WebMCPStatus) => void;
}

interface ToolRegistration {
  unregister: () => void;
}

const inputSchema = {
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

function isValidInput(input: unknown): input is DenialDetailsToolInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const keys = Object.keys(input);
  return (
    keys.length === 1 &&
    keys[0] === "case_id" &&
    "case_id" in input &&
    input.case_id === mayaCase.case_id
  );
}

export function getDenialDetails(input: unknown): DenialDetails {
  if (!isValidInput(input)) {
    throw new TypeError(
      "Invalid input: case_id must be \"" +
        mayaCase.case_id +
        "\" with no additional properties.",
    );
  }

  return {
    case_id: mayaCase.case_id,
    service: mayaCase.service,
    decision: mayaCase.decision,
    decision_date: mayaCase.decision_date,
    reason_code: mayaCase.reason_code,
    reason: mayaCase.reason,
    appeal_deadline: mayaCase.appeal_deadline,
    payer: mayaCase.payer,
  };
}

export async function registerDenialDetailsTool({
  onAccess,
  onStatusChange,
}: RegistrationOptions): Promise<ToolRegistration> {
  if (typeof document === "undefined" || !document.modelContext) {
    onStatusChange("unavailable");
    return { unregister: () => undefined };
  }

  const controller = new AbortController();

  try {
    await document.modelContext.registerTool<DenialDetailsToolInput, DenialDetails>(
      {
        name: DENIAL_DETAILS_TOOL_NAME,
        title: "Get denial details",
        description:
          "Use this read-only tool to retrieve the insurer, decision, reason, and appeal deadline for a specific ASSERA prior-authorization case.",
        inputSchema,
        annotations: {
          readOnlyHint: true,
          untrustedContentHint: false,
        },
        execute: (input) => {
          const denialDetails = getDenialDetails(input);
          onAccess(new Date().toISOString());
          return denialDetails;
        },
      },
      { signal: controller.signal },
    );

    onStatusChange("available");
  } catch {
    if (!controller.signal.aborted) {
      onStatusChange("error");
    }
  }

  return {
    unregister: () => controller.abort(),
  };
}
