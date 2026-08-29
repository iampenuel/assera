import type {
  AppealEvidenceResult,
  AppealReadiness,
  CoverageRequirementsResult,
  DenialDetails,
  WebMCPStatus,
} from "../types/case";
import type { CaseToolInput } from "./case-tool-helpers";
import {
  caseToolInputSchema,
  readOnlyToolAnnotations,
} from "./case-tool-helpers";
import {
  COVERAGE_REQUIREMENTS_TOOL_NAME,
  getCoverageRequirements,
} from "./coverage-tools";
import { DENIAL_DETAILS_TOOL_NAME, getDenialDetails } from "./denial-tools";
import {
  APPEAL_EVIDENCE_TOOL_NAME,
  listAppealEvidence,
} from "./evidence-tools";
import {
  APPEAL_READINESS_TOOL_NAME,
  checkAppealReadiness,
} from "./readiness-tools";

type CaseToolResult =
  | DenialDetails
  | CoverageRequirementsResult
  | AppealEvidenceResult
  | AppealReadiness;

export type CaseToolName =
  | typeof DENIAL_DETAILS_TOOL_NAME
  | typeof COVERAGE_REQUIREMENTS_TOOL_NAME
  | typeof APPEAL_EVIDENCE_TOOL_NAME
  | typeof APPEAL_READINESS_TOOL_NAME;

export interface CaseToolActivityEvent {
  readonly toolName: CaseToolName;
  readonly title: string;
  readonly category: "READ";
  readonly impact: "No information changed";
  readonly occurredAt: string;
}

interface RegistrationOptions {
  onActivity: (event: CaseToolActivityEvent) => void;
  onStatusChange: (status: WebMCPStatus) => void;
}

interface ToolRegistration {
  unregister: () => void;
}

interface CaseToolDefinition {
  readonly name: CaseToolName;
  readonly title: string;
  readonly description: string;
  readonly activityTitle: string;
  readonly execute: (input: unknown) => CaseToolResult;
}

export const CASE_TOOL_NAMES = [
  DENIAL_DETAILS_TOOL_NAME,
  COVERAGE_REQUIREMENTS_TOOL_NAME,
  APPEAL_EVIDENCE_TOOL_NAME,
  APPEAL_READINESS_TOOL_NAME,
] as const;

const caseToolDefinitions: readonly CaseToolDefinition[] = [
  {
    name: DENIAL_DETAILS_TOOL_NAME,
    title: "Get denial details",
    description:
      "Use this read-only tool to retrieve what happened in a specific ASSERA prior-authorization case: the insurer decision, denial reason, and appeal deadline.",
    activityTitle: "Denial details accessed",
    execute: getDenialDetails,
  },
  {
    name: COVERAGE_REQUIREMENTS_TOOL_NAME,
    title: "Get coverage requirements",
    description:
      "Use this read-only tool when you need the fictional administrative coverage requirements relevant to the denied service. It retrieves policy criteria and does not determine medical necessity.",
    activityTitle: "Coverage requirements accessed",
    execute: getCoverageRequirements,
  },
  {
    name: APPEAL_EVIDENCE_TOOL_NAME,
    title: "List appeal evidence",
    description:
      "Use this read-only tool to list the structured evidence already available in the ASSERA case workspace. It does not determine which coverage requirements are satisfied.",
    activityTitle: "Appeal evidence accessed",
    execute: listAppealEvidence,
  },
  {
    name: APPEAL_READINESS_TOOL_NAME,
    title: "Check appeal readiness",
    description:
      "Use this read-only tool to deterministically compare coverage requirements with available structured evidence and report which administrative requirements are complete, incomplete, or unavailable. It does not predict appeal success or determine medical necessity.",
    activityTitle: "Appeal readiness checked",
    execute: checkAppealReadiness,
  },
];

function createRegisteredTools(
  onActivity: RegistrationOptions["onActivity"],
): WebMCPTool<CaseToolInput, CaseToolResult>[] {
  return caseToolDefinitions.map((definition) => ({
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: caseToolInputSchema,
    annotations: readOnlyToolAnnotations,
    execute: (input) => {
      const result = definition.execute(input);
      onActivity({
        toolName: definition.name,
        title: definition.activityTitle,
        category: "READ",
        impact: "No information changed",
        occurredAt: new Date().toISOString(),
      });
      return result;
    },
  }));
}

export async function registerCaseTools({
  onActivity,
  onStatusChange,
}: RegistrationOptions): Promise<ToolRegistration> {
  if (typeof document === "undefined" || !document.modelContext) {
    onStatusChange("unavailable");
    return { unregister: () => undefined };
  }

  const controller = new AbortController();

  try {
    for (const tool of createRegisteredTools(onActivity)) {
      await document.modelContext.registerTool(tool, { signal: controller.signal });
    }
    onStatusChange("available");
  } catch {
    const wasAborted = controller.signal.aborted;
    controller.abort();
    if (!wasAborted) onStatusChange("error");
  }

  return {
    unregister: () => controller.abort(),
  };
}

export { getCoverageRequirements } from "./coverage-tools";
export { getDenialDetails } from "./denial-tools";
export { listAppealEvidence } from "./evidence-tools";
export { checkAppealReadiness } from "./readiness-tools";
export { CaseToolError } from "./case-tool-helpers";
