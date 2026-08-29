import type {
  CaseWorkspaceToolAdapter,
  PrepareAppealResult,
} from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const PREPARE_APPEAL_TOOL_NAME = "prepare_appeal";

export function prepareAppeal(
  input: unknown,
  adapter: CaseWorkspaceToolAdapter,
): PrepareAppealResult {
  const snapshot = adapter.getSnapshot();
  requireKnownCase(input, snapshot.caseId);
  return adapter.prepareAppeal();
}
