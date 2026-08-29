import { SUPPORTED_CASE_ID } from "../data/case-fixture";
import { createStandaloneCaseWorkspace } from "../domain/case-workspace";
import type {
  AppealEvidenceResult,
  AppealReadiness,
  CaseWorkspaceAdapter,
  CoverageRequirementsResult,
  DenialDetails,
  PrepareAppealResult,
  WebMCPStatus,
  WorkspaceActivity,
  WorkspaceActivityInput,
} from "../types/case";
import type { CaseToolInput } from "./case-tool-helpers";
import {
  createCaseToolInputSchema,
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
import { PREPARE_APPEAL_TOOL_NAME, prepareAppeal } from "./prepare-tools";
import {
  APPEAL_READINESS_TOOL_NAME,
  checkAppealReadiness,
} from "./readiness-tools";

type CaseToolResult =
  | DenialDetails
  | CoverageRequirementsResult
  | AppealEvidenceResult
  | AppealReadiness
  | PrepareAppealResult;

export type CaseToolName =
  | typeof DENIAL_DETAILS_TOOL_NAME
  | typeof COVERAGE_REQUIREMENTS_TOOL_NAME
  | typeof APPEAL_EVIDENCE_TOOL_NAME
  | typeof APPEAL_READINESS_TOOL_NAME
  | typeof PREPARE_APPEAL_TOOL_NAME;

export type CaseToolActivityEvent = WorkspaceActivity;

interface RegistrationOptions {
  readonly adapter?: CaseWorkspaceAdapter;
  readonly onActivity?: (event: CaseToolActivityEvent) => void;
  readonly onStatusChange: (status: WebMCPStatus) => void;
}

interface ToolRegistration {
  unregister: () => void;
}

interface CaseToolDefinition {
  readonly name: CaseToolName;
  readonly title: string;
  readonly description: string;
  readonly annotations: WebMCPToolAnnotations;
  readonly execute: (
    input: unknown,
    adapter: CaseWorkspaceAdapter,
  ) => CaseToolResult;
  readonly successActivity?: WorkspaceActivityInput;
}

export const CASE_TOOL_NAMES = [
  DENIAL_DETAILS_TOOL_NAME,
  COVERAGE_REQUIREMENTS_TOOL_NAME,
  APPEAL_EVIDENCE_TOOL_NAME,
  APPEAL_READINESS_TOOL_NAME,
  PREPARE_APPEAL_TOOL_NAME,
] as const;

const caseToolDefinitions: readonly CaseToolDefinition[] = [
  {
    name: DENIAL_DETAILS_TOOL_NAME,
    title: "Get denial details",
    description:
      "Use this read-only tool to retrieve what happened in a specific ASSERA prior-authorization case: the insurer decision, denial reason, and appeal deadline.",
    annotations: readOnlyToolAnnotations,
    execute: (input, adapter) =>
      getDenialDetails(input, adapter.getSnapshot()),
    successActivity: {
      toolName: DENIAL_DETAILS_TOOL_NAME,
      title: "Denial details accessed",
      category: "READ",
      actor: "AGENT",
      outcome: "completed",
      impact: "No information changed",
    },
  },
  {
    name: COVERAGE_REQUIREMENTS_TOOL_NAME,
    title: "Get coverage requirements",
    description:
      "Use this read-only tool when you need the fictional administrative coverage requirements relevant to the denied service. It retrieves policy criteria and does not determine medical necessity.",
    annotations: readOnlyToolAnnotations,
    execute: (input, adapter) =>
      getCoverageRequirements(input, adapter.getSnapshot()),
    successActivity: {
      toolName: COVERAGE_REQUIREMENTS_TOOL_NAME,
      title: "Coverage requirements accessed",
      category: "READ",
      actor: "AGENT",
      outcome: "completed",
      impact: "No information changed",
    },
  },
  {
    name: APPEAL_EVIDENCE_TOOL_NAME,
    title: "List appeal evidence",
    description:
      "Use this read-only tool to list the structured evidence currently available in the ASSERA case workspace. It does not determine which coverage requirements are satisfied.",
    annotations: readOnlyToolAnnotations,
    execute: (input, adapter) =>
      listAppealEvidence(input, adapter.getSnapshot()),
    successActivity: {
      toolName: APPEAL_EVIDENCE_TOOL_NAME,
      title: "Appeal evidence accessed",
      category: "READ",
      actor: "AGENT",
      outcome: "completed",
      impact: "No information changed",
    },
  },
  {
    name: APPEAL_READINESS_TOOL_NAME,
    title: "Check appeal readiness",
    description:
      "Use this read-only tool to deterministically compare coverage requirements with current structured evidence and report which administrative requirements are complete, incomplete, or unavailable. It does not predict appeal success or determine medical necessity.",
    annotations: readOnlyToolAnnotations,
    execute: (input, adapter) =>
      checkAppealReadiness(input, adapter.getSnapshot()),
    successActivity: {
      toolName: APPEAL_READINESS_TOOL_NAME,
      title: "Appeal readiness checked",
      category: "READ",
      actor: "AGENT",
      outcome: "completed",
      impact: "No information changed",
    },
  },
  {
    name: PREPARE_APPEAL_TOOL_NAME,
    title: "Prepare appeal",
    description:
      "Use this tool to create or retrieve a structured administrative appeal draft from the current ASSERA case workspace after all required information has been confirmed. It changes only local draft state and does not submit or send anything.",
    annotations: {
      readOnlyHint: false,
      untrustedContentHint: false,
    },
    execute: (input, adapter) => prepareAppeal(input, adapter),
  },
];

function createRegisteredTools(
  adapter: CaseWorkspaceAdapter,
  onActivity?: RegistrationOptions["onActivity"],
): WebMCPTool<CaseToolInput, CaseToolResult>[] {
  const caseId = adapter.getSnapshot().caseId;

  return caseToolDefinitions.map((definition) => ({
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: createCaseToolInputSchema(caseId),
    annotations: definition.annotations,
    execute: (input) => {
      const activityCountBefore = adapter.getSnapshot().activities.length;

      try {
        const result = definition.execute(input, adapter);
        if (definition.successActivity) {
          adapter.recordActivity(definition.successActivity);
        }
        return result;
      } finally {
        if (onActivity) {
          const newActivities = adapter
            .getSnapshot()
            .activities.slice(activityCountBefore);
          for (const activity of newActivities) onActivity(activity);
        }
      }
    },
  }));
}

export async function registerCaseTools({
  adapter = createStandaloneCaseWorkspace(SUPPORTED_CASE_ID).adapter,
  onActivity,
  onStatusChange,
}: RegistrationOptions): Promise<ToolRegistration> {
  if (typeof document === "undefined" || !document.modelContext) {
    onStatusChange("unavailable");
    return { unregister: () => undefined };
  }

  const controller = new AbortController();

  try {
    for (const tool of createRegisteredTools(adapter, onActivity)) {
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
export { prepareAppeal } from "./prepare-tools";
export { checkAppealReadiness } from "./readiness-tools";
export { CaseToolError } from "./case-tool-helpers";
export {
  caseWorkspaceReducer,
  createCaseWorkspaceAdapter,
  createInitialCaseWorkspaceState,
  createStandaloneCaseWorkspace,
  selectCaseWorkspaceSnapshot,
} from "../domain/case-workspace";
export { createAppealDraft, PrepareBlockedError } from "../domain/appeal-draft";
export {
  deriveEffectiveEvidence,
  TreatmentDateValidationError,
  validateTreatmentDates,
} from "../domain/treatment-dates";
