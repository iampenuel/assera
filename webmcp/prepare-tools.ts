import type {
  CaseWorkspaceAdapter,
  PrepareAppealResult,
} from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const PREPARE_APPEAL_TOOL_NAME = "prepare_appeal";

export function prepareAppeal(
  input: unknown,
  adapter: CaseWorkspaceAdapter,
): PrepareAppealResult {
  const snapshot = adapter.getSnapshot();
  requireKnownCase(input, snapshot.caseId);
  return adapter.prepareAppeal("AGENT");
}
