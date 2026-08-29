import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const esbuild = fileURLToPath(new URL("../node_modules/.bin/esbuild", import.meta.url));
const entry = fileURLToPath(new URL("../webmcp/register-case-tools.ts", import.meta.url));
const compiledTools = execFileSync(
  esbuild,
  [entry, "--bundle", "--platform=node", "--format=esm"],
  { encoding: "utf8" },
);
const moduleUrl =
  "data:text/javascript;base64," + Buffer.from(compiledTools).toString("base64");
const caseTools = await import(moduleUrl);

const validInput = { case_id: "NS-PA-48291" };
const validDates = {
  start_date: "2026-07-01",
  end_date: "2026-08-19",
  confirmation: true,
};

function createTestWorkspace() {
  let state = caseTools.createInitialCaseWorkspaceState(validInput.case_id);
  let tick = 0;
  const adapters = caseTools.createCaseWorkspaceAdapters({
    getState: () => state,
    applyAction: (action) => {
      state = caseTools.caseWorkspaceReducer(state, action);
      return state;
    },
    now: () => `2026-08-29T12:${String(tick++).padStart(2, "0")}:00.000Z`,
  });
  return { ...adapters, getState: () => state };
}

function assertCaseToolError(action, code, message) {
  assert.throws(action, (error) => {
    assert.equal(error.name, "CaseToolError");
    assert.equal(error.code, code);
    assert.equal(error.message, message);
    return true;
  });
}

test("Milestone 01 and 02 READ contracts remain unchanged", () => {
  assert.deepEqual(caseTools.getDenialDetails(validInput), {
    case_id: "NS-PA-48291",
    service: "MRI — Right Knee",
    decision: "denied",
    decision_date: "2026-08-25",
    reason_code: "DOC-214",
    reason:
      "Documentation did not establish six weeks of physician-directed conservative treatment.",
    appeal_deadline: "2026-10-29",
    payer: "Northstar Health",
  });

  const coverage = caseTools.getCoverageRequirements(validInput);
  assert.equal(coverage.policy_id, "NS-MSK-MRI-KNEE-2026");
  assert.deepEqual(coverage.requirements.map(({ id }) => id), [
    "physician_evaluation",
    "prior_xray",
    "conservative_treatment_duration",
    "persistent_symptoms",
    "treatment_date_range",
  ]);

  const evidence = caseTools.listAppealEvidence(validInput);
  assert.equal(evidence.count, 4);
  assert.equal(evidence.documents.at(-1).status, "insurer_source");

  const readiness = caseTools.checkAppealReadiness(validInput);
  assert.deepEqual(readiness.summary, {
    total: 5,
    complete: 4,
    incomplete: 1,
    unavailable: 0,
  });
  assert.equal(readiness.ready_to_prepare, false);
});

test("date validation and human confirmation preserve the 4/5 to 5/5 transition", () => {
  const { uiActions, toolAdapter } = createTestWorkspace();
  assert.throws(
    () => caseTools.validateTreatmentDates({ ...validDates, confirmation: false }, "2026-08-20"),
    (error) => error.code === "CONFIRMATION_REQUIRED",
  );
  assert.throws(
    () => caseTools.validateTreatmentDates({ ...validDates, start_date: "2026-07-10" }, "2026-08-20"),
    (error) => error.code === "TREATMENT_RANGE_TOO_SHORT",
  );

  const result = uiActions.confirmTreatmentDates(validDates);
  const snapshot = toolAdapter.getSnapshot();
  assert.equal(result.action, "confirmed");
  assert.equal(result.confirmation.duration_days, 49);
  assert.equal(result.confirmation.provided_via, "ASSERA_UI");
  assert.equal(snapshot.readiness.summary.complete, 5);
  assert.equal(snapshot.readiness.ready_to_prepare, true);
  assert.equal(snapshot.appealDraft, null);
  assert.equal(snapshot.appealApproval, null);
});

test("prepare remains typed-blocked at 4/5 and records a truthful AGENT activity", () => {
  const { toolAdapter } = createTestWorkspace();
  assert.throws(
    () => caseTools.prepareAppeal(validInput, toolAdapter),
    (error) => {
      assert.equal(error.code, "PREPARE_BLOCKED");
      assert.deepEqual(error.incomplete_requirement_ids, ["treatment_date_range"]);
      return true;
    },
  );
  assert.deepEqual(toolAdapter.getSnapshot().activities[0], {
    id: "prepare_appeal-2026-08-29T12:00:00.000Z-0",
    title: "Appeal preparation blocked",
    category: "PREPARE",
    actor: "AGENT",
    outcome: "blocked",
    impact: "Treatment dates require confirmation; no draft created or submitted",
    toolName: "prepare_appeal",
    occurredAt: "2026-08-29T12:00:00.000Z",
  });
});

test("a newly prepared deterministic draft is version 1 and never uses the network", () => {
  const { uiActions, toolAdapter } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail("Local preparation must not use the network");
  try {
    const result = caseTools.prepareAppeal(validInput, toolAdapter);
    assert.equal(result.action, "created");
    assert.equal(result.draft.version, 1);
    assert.equal(result.draft.submission_status, "not_submitted");
    assert.deepEqual(result.draft.unresolved_items, []);
    assert.deepEqual(result.draft.evidence_ids, [
      "evidence-orthopedic-evaluation",
      "evidence-physical-therapy",
      "evidence-knee-xray",
      "evidence-denial-notice",
    ]);
    assert.match(result.draft.statement, /July 1, 2026 through August 19, 2026/);
    assert.match(result.draft.statement, /has not been submitted/);
    assert.doesNotMatch(result.draft.statement, /will succeed|medically necessary|illegal denial/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repeated prepare and unchanged confirmation preserve the exact draft and version", () => {
  const { uiActions, toolAdapter } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  const created = uiActions.prepareAppeal();
  const stored = toolAdapter.getSnapshot().appealDraft;
  const reused = uiActions.prepareAppeal();
  const activityCount = toolAdapter.getSnapshot().activities.length;
  const unchanged = uiActions.confirmTreatmentDates(validDates);

  assert.equal(created.action, "created");
  assert.equal(reused.action, "reused");
  assert.equal(reused.draft, stored);
  assert.equal(reused.draft.version, 1);
  assert.equal(unchanged.action, "unchanged");
  assert.equal(toolAdapter.getSnapshot().appealDraft, stored);
  assert.equal(toolAdapter.getSnapshot().activities.length, activityCount);
});

test("material statement edits increment exactly once while identical saves are true no-ops", () => {
  const { uiActions, toolAdapter } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  const created = uiActions.prepareAppeal().draft;
  const activityCount = toolAdapter.getSnapshot().activities.length;
  const unchanged = uiActions.updateDraftStatement(`  ${created.statement}  `);
  assert.equal(unchanged, created);
  assert.equal(unchanged.version, 1);
  assert.equal(unchanged.updated_at, created.updated_at);
  assert.equal(toolAdapter.getSnapshot().activities.length, activityCount);

  const edited = uiActions.updateDraftStatement("Patient-reviewed local statement.");
  assert.equal(edited.version, 2);
  assert.notEqual(edited.updated_at, created.updated_at);
  assert.equal(toolAdapter.getSnapshot().activities.at(-1).title, "Appeal draft updated");
});

test("the pure package builder blocks before draft and performs no mutation", () => {
  const { toolAdapter, uiActions, getState } = createTestWorkspace();
  const before = JSON.stringify(getState());
  assert.throws(
    () => caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot()),
    (error) => error.code === "PREVIEW_NOT_AVAILABLE",
  );
  assert.equal(JSON.stringify(getState()), before);

  uiActions.confirmTreatmentDates(validDates);
  uiActions.prepareAppeal();
  const readyBefore = JSON.stringify(getState());
  caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  assert.equal(JSON.stringify(getState()), readyBefore);
});

test("the package preview uses the exact stored statement, four documents, and stable identity", () => {
  const { toolAdapter, uiActions } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  const draft = uiActions.prepareAppeal().draft;
  const first = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  const second = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());

  assert.equal(first.package_id, `${draft.id}-package`);
  assert.equal(first.package_version, `${draft.id}:v1`);
  assert.equal(first.package_version, second.package_version);
  assert.equal(first.statement, draft.statement);
  assert.equal(first.included_documents.length, 4);
  assert.deepEqual(first.included_documents.map(({ name, role }) => ({ name, role })), [
    { name: "Orthopedic Evaluation", role: "supporting_evidence" },
    { name: "Physical Therapy Summary", role: "supporting_evidence" },
    { name: "Knee X-Ray Report", role: "supporting_evidence" },
    { name: "Denial Notice", role: "denial_context" },
  ]);
  assert.equal(first.destination.name, "Northstar Health Appeals Department");
  assert.equal(first.human_confirmed_information.treatment_start_date, "2026-07-01");
  assert.equal(first.human_confirmed_information.treatment_end_date, "2026-08-19");
  assert.deepEqual(first.readiness_summary, {
    total: 5,
    complete: 5,
    incomplete: 0,
    unavailable: 0,
  });
  assert.deepEqual(first.unresolved_items, []);
  assert.equal(first.approval.status, "not_approved");
  assert.equal(first.submission_status, "not_submitted");
  assert.equal(first.external_submission, false);
  assert.deepEqual(first.shared_information.map(({ field }) => field), [
    "patient_name",
    "case_id",
    "requested_service",
    "denial_reason",
    "denial_reason_code",
    "treatment_start_date",
    "treatment_end_date",
    "appeal_statement",
    "included_documents",
  ]);
});

test("approval domain validation requires HUMAN, explicit confirmation, a draft, and current version", () => {
  const { toolAdapter, uiActions } = createTestWorkspace();
  assert.throws(
    () => caseTools.approveAppealPackage(toolAdapter.getSnapshot(), "missing", true, "HUMAN", "2026-08-29T13:00:00.000Z"),
    (error) => error.code === "APPROVAL_NOT_AVAILABLE",
  );
  uiActions.confirmTreatmentDates(validDates);
  uiActions.prepareAppeal();
  const preview = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  assert.throws(
    () => caseTools.approveAppealPackage(toolAdapter.getSnapshot(), preview.package_version, false, "HUMAN", "2026-08-29T13:00:00.000Z"),
    (error) => error.code === "APPROVAL_CONFIRMATION_REQUIRED",
  );
  assert.throws(
    () => caseTools.approveAppealPackage(toolAdapter.getSnapshot(), preview.package_version, true, "AGENT", "2026-08-29T13:00:00.000Z"),
    (error) => error.code === "APPROVAL_ACTOR_NOT_ALLOWED",
  );
  assert.throws(
    () => caseTools.approveAppealPackage(toolAdapter.getSnapshot(), `${preview.package_version}-stale`, true, "HUMAN", "2026-08-29T13:00:00.000Z"),
    (error) => error.code === "PACKAGE_VERSION_MISMATCH",
  );
});

test("human approval records exact provenance and repeated approval is idempotent", () => {
  const { toolAdapter, uiActions } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  uiActions.prepareAppeal();
  const preview = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  const approval = uiActions.approveAppealPackage(preview.package_version, true);
  const activityCount = toolAdapter.getSnapshot().activities.length;
  const repeated = uiActions.approveAppealPackage(preview.package_version, true);

  assert.equal(repeated, approval);
  assert.equal(toolAdapter.getSnapshot().activities.length, activityCount);
  assert.deepEqual(approval.approved_by, { type: "patient", name: "Maya Thompson" });
  assert.equal(approval.package_version, preview.package_version);
  assert.equal(approval.draft_version, 1);
  assert.equal(approval.provided_via, "ASSERA_UI");
  assert.equal(approval.scope, "SIMULATED_SUBMISSION");
  assert.equal(approval.synthetic, true);
  assert.deepEqual(toolAdapter.getSnapshot().activities.at(-1), {
    id: "human-2026-08-29T12:02:00.000Z-2",
    title: "Appeal package approved",
    category: "CONTROL",
    actor: "HUMAN",
    outcome: "completed",
    impact: "Approval recorded for this package version; nothing submitted",
    occurredAt: "2026-08-29T12:02:00.000Z",
  });
});

test("material edits clear approval and create package v2; unchanged saves preserve approval", () => {
  const { toolAdapter, uiActions } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  const draft = uiActions.prepareAppeal().draft;
  const v1 = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  const approval = uiActions.approveAppealPackage(v1.package_version, true);
  const activityCount = toolAdapter.getSnapshot().activities.length;

  uiActions.updateDraftStatement(draft.statement);
  assert.equal(toolAdapter.getSnapshot().appealApproval, approval);
  assert.equal(toolAdapter.getSnapshot().activities.length, activityCount);
  uiActions.prepareAppeal();
  assert.equal(toolAdapter.getSnapshot().appealApproval, approval);

  uiActions.updateDraftStatement(`${draft.statement}\n\nMaya reviewed this local draft.`);
  const snapshot = toolAdapter.getSnapshot();
  const v2 = caseTools.buildAppealPackagePreview(snapshot);
  assert.equal(snapshot.appealDraft.version, 2);
  assert.equal(snapshot.appealApproval, null);
  assert.equal(v2.package_version, `${draft.id}:v2`);
  assert.equal(v2.approval.status, "not_approved");
  assert.equal(snapshot.activities.at(-1).impact, "Draft updated; previous package approval cleared. Nothing submitted.");
});

test("date changes invalidate the draft and approval while revocation preserves draft/readiness", () => {
  const first = createTestWorkspace();
  first.uiActions.confirmTreatmentDates(validDates);
  first.uiActions.prepareAppeal();
  const preview = caseTools.buildAppealPackagePreview(first.toolAdapter.getSnapshot());
  first.uiActions.approveAppealPackage(preview.package_version, true);
  const draft = first.toolAdapter.getSnapshot().appealDraft;
  assert.equal(first.uiActions.revokeAppealApproval(), true);
  assert.equal(first.toolAdapter.getSnapshot().appealApproval, null);
  assert.equal(first.toolAdapter.getSnapshot().appealDraft, draft);
  assert.equal(first.toolAdapter.getSnapshot().readiness.summary.complete, 5);
  assert.equal(first.toolAdapter.getSnapshot().activities.at(-1).category, "CONTROL");
  assert.equal(first.uiActions.revokeAppealApproval(), false);

  const second = createTestWorkspace();
  second.uiActions.confirmTreatmentDates(validDates);
  second.uiActions.prepareAppeal();
  const secondPreview = caseTools.buildAppealPackagePreview(second.toolAdapter.getSnapshot());
  second.uiActions.approveAppealPackage(secondPreview.package_version, true);
  const changed = second.uiActions.confirmTreatmentDates({
    start_date: "2026-07-02",
    end_date: "2026-08-20",
    confirmation: true,
  });
  assert.equal(changed.draft_invalidated, true);
  assert.equal(second.toolAdapter.getSnapshot().appealDraft, null);
  assert.equal(second.toolAdapter.getSnapshot().appealApproval, null);
  assert.match(second.toolAdapter.getSnapshot().activities.at(-1).impact, /draft and package approval were cleared/);
});

test("WebMCP receives a runtime adapter that cannot confirm, edit, approve, or revoke", () => {
  const { toolAdapter } = createTestWorkspace();
  assert.deepEqual(Object.keys(toolAdapter).sort(), [
    "getSnapshot",
    "prepareAppeal",
    "previewAppeal",
    "recordReadActivity",
  ]);
  assert.equal("approveAppealPackage" in toolAdapter, false);
  assert.equal("revokeAppealApproval" in toolAdapter, false);
  assert.equal("confirmTreatmentDates" in toolAdapter, false);
  assert.equal("updateDraftStatement" in toolAdapter, false);
});

test("registers exactly six unique tools through one signal with five READ and one PREPARE", async () => {
  const registeredTools = [];
  const registrationOptions = [];
  const statuses = [];
  const { toolAdapter, uiActions } = createTestWorkspace();
  globalThis.document = {
    modelContext: {
      async registerTool(tool, options) {
        assert.equal(registeredTools.some(({ name }) => name === tool.name), false);
        registeredTools.push(tool);
        registrationOptions.push(options);
      },
    },
  };

  const registration = await caseTools.registerCaseTools({
    adapter: toolAdapter,
    onStatusChange: (status) => statuses.push(status),
  });
  assert.deepEqual(registeredTools.map(({ name }) => name), [
    "get_denial_details",
    "get_coverage_requirements",
    "list_appeal_evidence",
    "check_appeal_readiness",
    "prepare_appeal",
    "preview_appeal",
  ]);
  assert.equal(registeredTools.length, 6);
  assert.equal(registeredTools.filter(({ annotations }) => annotations.readOnlyHint).length, 5);
  assert.equal(registeredTools.find(({ name }) => name === "preview_appeal").annotations.untrustedContentHint, true);
  assert.equal(registeredTools.find(({ name }) => name === "prepare_appeal").annotations.readOnlyHint, false);
  assert.equal(registeredTools.some(({ name }) => /approve|revoke|submit|send|status|act/i.test(name)), false);
  for (const tool of registeredTools) {
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.deepEqual(tool.inputSchema.required, ["case_id"]);
    assert.equal(tool.inputSchema.properties.case_id.const, validInput.case_id);
  }
  assert.deepEqual(statuses, ["available"]);
  assert.equal(new Set(registrationOptions.map(({ signal }) => signal)).size, 1);

  uiActions.confirmTreatmentDates(validDates);
  registeredTools.find(({ name }) => name === "prepare_appeal").execute(validInput);
  const preview = registeredTools.find(({ name }) => name === "preview_appeal").execute(validInput);
  assert.equal(preview.approval_status, "not_approved");
  assert.equal(preview.submission_status, "not_submitted");
  assert.equal(preview.statement, toolAdapter.getSnapshot().appealDraft.statement);
  assert.equal(toolAdapter.getSnapshot().activities.at(-1).category, "READ");

  registration.unregister();
  assert.equal(registrationOptions.every(({ signal }) => signal.aborted), true);
  delete globalThis.document;
});

test("preview blocked state is visible, while malformed and unknown input create no activity", async () => {
  const registeredTools = [];
  const { toolAdapter } = createTestWorkspace();
  globalThis.document = {
    modelContext: {
      async registerTool(tool) {
        registeredTools.push(tool);
      },
    },
  };
  const registration = await caseTools.registerCaseTools({
    adapter: toolAdapter,
    onStatusChange: () => undefined,
  });
  const previewTool = registeredTools.find(({ name }) => name === "preview_appeal");
  assert.throws(() => previewTool.execute(validInput), (error) => error.code === "PREVIEW_NOT_AVAILABLE");
  assert.deepEqual(toolAdapter.getSnapshot().activities.at(-1), {
    id: "preview_appeal-2026-08-29T12:00:00.000Z-0",
    title: "Appeal package preview unavailable",
    category: "READ",
    actor: "AGENT",
    outcome: "blocked",
    impact: "Prepare an appeal draft first; no information changed",
    toolName: "preview_appeal",
    occurredAt: "2026-08-29T12:00:00.000Z",
  });
  const activityCount = toolAdapter.getSnapshot().activities.length;
  assertCaseToolError(
    () => previewTool.execute({}),
    "INVALID_INPUT",
    "A valid case_id is required.",
  );
  assertCaseToolError(
    () => previewTool.execute({ case_id: "UNKNOWN" }),
    "CASE_NOT_FOUND",
    "No ASSERA case was found for case_id “UNKNOWN”.",
  );
  assert.equal(toolAdapter.getSnapshot().activities.length, activityCount);
  registration.unregister();
  delete globalThis.document;
});

test("preview reflects approval and causes no focus, navigation, or scroll side effect", () => {
  const { toolAdapter, uiActions } = createTestWorkspace();
  uiActions.confirmTreatmentDates(validDates);
  uiActions.prepareAppeal();
  const initial = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  uiActions.approveAppealPackage(initial.package_version, true);
  globalThis.window = new Proxy({}, {
    get() {
      assert.fail("preview_appeal must not access window navigation, focus, or scroll");
    },
  });
  try {
    const result = caseTools.previewAppeal(validInput, toolAdapter);
    assert.equal(result.approval_status, "approved");
    assert.equal(result.approval.approved_by, "Maya Thompson");
    assert.equal(result.approval.package_version, initial.package_version);
    assert.equal(result.submission_status, "not_submitted");
    assert.equal(result.external_submission, false);
  } finally {
    delete globalThis.window;
  }
});

test("the no-WebMCP fallback preserves all human review and approval actions", async () => {
  delete globalThis.document;
  const statuses = [];
  const { toolAdapter, uiActions } = createTestWorkspace();
  const registration = await caseTools.registerCaseTools({
    adapter: toolAdapter,
    onStatusChange: (status) => statuses.push(status),
  });
  assert.deepEqual(statuses, ["unavailable"]);
  uiActions.confirmTreatmentDates(validDates);
  uiActions.prepareAppeal();
  const preview = caseTools.buildAppealPackagePreview(toolAdapter.getSnapshot());
  uiActions.approveAppealPackage(preview.package_version, true);
  assert.equal(toolAdapter.getSnapshot().appealApproval.status, "approved");
  assert.equal(toolAdapter.getSnapshot().appealDraft.submission_status, "not_submitted");
  assert.doesNotThrow(() => registration.unregister());
});

test("all three eval specifications parse and Milestone 04 keeps approval human-only", async () => {
  const [readEval, prepareEval, reviewEval] = await Promise.all([
    readFile(new URL("../evals/read-layer.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../evals/prepare-layer.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../evals/review-layer.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(readEval.milestone, "02-read-layer");
  assert.equal(prepareEval.milestone, "03-prepare-layer");
  assert.equal(reviewEval.milestone, "04-review-approval-boundary");
  assert.equal(reviewEval.case_id, validInput.case_id);
  assert.equal(reviewEval.synthetic, true);
  assert.equal(reviewEval.scenarios.length, 9);
  assert.equal(reviewEval.scenarios[0].expected_error, "PREVIEW_NOT_AVAILABLE");
  assert.equal(reviewEval.scenarios[2].expected.webmcp_approval_tool, false);
  assert.equal(reviewEval.scenarios[7].expected.human_ui_required, true);
  assert.equal(reviewEval.scenarios[8].expected.act_tool, false);
  assert.equal(reviewEval.scenarios.every(({ external_submission }) => external_submission === false), true);
});

test("source integration contains accessible review controls and no approval or ACT tool", async () => {
  const [dashboard, workspace, review, registrar] = await Promise.all([
    readFile(new URL("../components/case/case-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/case/appeal-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/case/appeal-package-review.tsx", import.meta.url), "utf8"),
    readFile(new URL("../webmcp/register-case-tools.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dashboard, /registerCaseTools\(\{\s*adapter: toolAdapter,/s);
  assert.match(workspace, /Draft version/);
  assert.match(review, /<fieldset/);
  assert.match(review, /I have reviewed the appeal statement, documents, and/);
  assert.match(review, /Approve this package/);
  assert.match(review, /Revoke approval/);
  assert.match(review, /Nothing has been submitted/);
  assert.doesNotMatch(registrar, /approve_appeal|approve_package|revoke_approval|submit_appeal|send_appeal|get_appeal_status/);
  assert.doesNotMatch(`${dashboard}${workspace}${review}${registrar}`, /requestUserInteraction|fetch\(/);
  assert.doesNotMatch(review, />\s*(Submit|Send|File appeal)\s*</i);
});
